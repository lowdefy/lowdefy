/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { type } from '@lowdefy/helpers';

import journeyUser from '../journeyUser.js';
import roleKey from '../roleKey.js';

function stringLeaves(value) {
  if (type.isString(value)) return [value];
  if (type.isArray(value)) return value.flatMap(stringLeaves);
  if (type.isObject(value)) return Object.values(value).flatMap(stringLeaves);
  return [];
}

function callKey({ kind, pageId, requestId, endpointId }) {
  return kind === 'request' ? `request:${pageId}/${requestId}` : `endpoint:${endpointId}`;
}

// The calls of the measured run that write, by callKey.
function listWrites(exercised) {
  return new Set([
    ...(exercised?.requests ?? [])
      .filter(({ write }) => write)
      .map(({ pageId, requestId }) => callKey({ kind: 'request', pageId, requestId })),
    ...(exercised?.endpoints ?? [])
      .filter(({ write }) => write)
      .map(({ endpointId }) => callKey({ kind: 'endpoint', endpointId })),
  ]);
}

// The insider's fixture document a payload names: the first document of the insider's
// organization, in a connection whose collection the build names, with a string _id and a
// top-level field equal to one of the payload's strings. The organization id itself names no
// row: every insider row holds it.
function findNamedDocument({ collections, dataSet, organizationId, payload }) {
  const values = new Set(stringLeaves(payload));
  values.delete(organizationId);
  for (const [connectionId, documents] of Object.entries(dataSet.fixtures)) {
    if (!type.isString(collections[connectionId])) continue;
    const document = documents.find(
      (candidate) =>
        type.isString(candidate._id) &&
        Object.values(candidate).includes(organizationId) &&
        Object.values(candidate).some((value) => type.isString(value) && values.has(value))
    );
    if (!type.isUndefined(document)) return { connectionId, document };
  }
  return null;
}

// The fields an expect.db can compare as the fixture wrote them: strings, numbers and booleans.
function plainFields(document) {
  return Object.fromEntries(
    Object.entries(document).filter(
      ([, value]) => type.isString(value) || type.isNumber(value) || type.isBoolean(value)
    )
  );
}

function toCallStep(call) {
  const payload = type.isObject(call.payload) ? call.payload : {};
  if (call.kind === 'request') {
    return { request: { pageId: call.pageId, requestId: call.requestId, payload } };
  }
  return { call: { endpoint: call.endpointId, payload } };
}

// Tenant, call form: a page-less journey in which a user of another organization sends each write
// the journey's page sent, with the payload the page built, and the insider's row the payload
// names is left as the fixture wrote it (expect.db). The tenant wall scopes queries rather than
// refusing them, so the proof is the row, not a status. The payloads come from a headless run of
// the journey (calls): a browser run does not record them.
function tenantCalls({ journey, dataSet, exercised, calls, collections = {} }) {
  if (type.isNone(dataSet)) {
    return { skipped: 'the journey declares no data: set' };
  }
  if (type.isNone(calls)) {
    return {
      skipped:
        'the call form replays the payloads a headless run records, and this journey needs a browser',
    };
  }
  const current = journeyUser({ journey, dataSet }).user;
  const organizationId = current?.organizationId;
  if (type.isNone(organizationId)) {
    return { skipped: "the journey's user has no organizationId" };
  }
  const outsiders = Object.keys(dataSet.users)
    .sort()
    .filter((name) => {
      const other = dataSet.users[name].organizationId;
      return !type.isNone(other) && other !== organizationId;
    });
  if (outsiders.length === 0) {
    return { skipped: 'the data set has no user in another organization' };
  }
  const outsiderName =
    outsiders.find((name) => roleKey(dataSet.users[name].roles) === roleKey(current.roles)) ??
    outsiders[0];
  const writes = listWrites(exercised);
  const seen = new Set();
  const steps = [];
  calls
    .filter((call) => call.actor === 'main' && writes.has(callKey(call)))
    .forEach((call) => {
      const named = findNamedDocument({
        collections,
        dataSet,
        organizationId,
        payload: call.payload,
      });
      const key = `${callKey(call)}#${named?.document._id}`;
      if (type.isNull(named) || seen.has(key)) return;
      seen.add(key);
      steps.push(toCallStep(call), {
        expect: {
          db: {
            collection: collections[named.connectionId],
            connectionId: named.connectionId,
            match: { _id: named.document._id },
            equals: [plainFields(named.document)],
          },
        },
      });
    });
  if (steps.length === 0) {
    return {
      skipped: `no write the journey sent names a ${organizationId} fixture row`,
    };
  }
  return [
    {
      kind: 'tenant',
      detail: `writes sent as ${outsiderName} of ${dataSet.users[outsiderName].organizationId}`,
      overrides: {
        user: outsiderName,
        pageId: undefined,
        pathParams: undefined,
        urlQuery: undefined,
      },
      steps,
    },
  ];
}

export default tenantCalls;
