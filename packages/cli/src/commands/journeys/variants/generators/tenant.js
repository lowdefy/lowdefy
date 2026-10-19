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

import findDataSteps from '../findDataSteps.js';
import journeyUser from '../journeyUser.js';
import roleKey from '../roleKey.js';

function belongsTo({ document, organizationId }) {
  return Object.values(document).some((value) => value === organizationId);
}

// Where a fixture value comes from: { connectionId, field } of the first
// fixture document with a top-level field equal to it, else one containing
// it; null when no fixture holds it.
function findValueSource({ fixtures, value }) {
  const tests = [(text) => text === value, (text) => text.includes(value)];
  for (const isMatch of tests) {
    for (const [connectionId, documents] of Object.entries(fixtures)) {
      for (const document of documents) {
        const field = Object.keys(document).find(
          (key) => type.isString(document[key]) && isMatch(document[key])
        );
        if (!type.isUndefined(field)) return { connectionId, field };
      }
    }
  }
  return null;
}

function stringLeaves(value) {
  if (type.isString(value)) return [value];
  if (type.isArray(value)) return value.flatMap(stringLeaves);
  if (type.isObject(value)) return Object.values(value).flatMap(stringLeaves);
  return [];
}

// Tenant: a user of another organization (with the journey user's roles when
// one has them) walks to the first data step, sees their own organization's
// row there, then sees none of the fixture values the journey selects or
// asserts on that page. The outsider's own row comes first, because
// expect.hidden alone also passes before rows arrive.
function tenant({ journey, dataSet }) {
  if (type.isNone(dataSet)) {
    return { skipped: 'the journey declares no data: set' };
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
  const dataSteps = findDataSteps({ journey, dataSet })
    .filter(({ value }) => !type.isNull(value))
    .map((dataStep) => ({
      ...dataStep,
      source: findValueSource({ fixtures: dataSet.fixtures, value: dataStep.value }),
    }))
    .filter(({ source }) => !type.isNull(source));
  if (dataSteps.length === 0) {
    return { skipped: 'no step selects or asserts a fixture value' };
  }
  const [first] = dataSteps;
  const { source } = first;
  const outsiderName =
    outsiders.find((name) => roleKey(dataSet.users[name].roles) === roleKey(current.roles)) ??
    outsiders[0];
  const outsiderOrganizationId = dataSet.users[outsiderName].organizationId;
  const outsiderDocuments = (dataSet.fixtures[source.connectionId] ?? []).filter((document) =>
    belongsTo({ document, organizationId: outsiderOrganizationId })
  );
  const outsiderValue = outsiderDocuments
    .map((document) => document[source.field])
    .find((value) => type.isString(value) && value.trim() !== '');
  if (type.isUndefined(outsiderValue)) {
    return {
      skipped: `add a ${source.connectionId} fixture for ${outsiderOrganizationId} so the tenant variant can prove the list loaded`,
    };
  }
  const outsiderStrings = stringLeaves(outsiderDocuments);
  const hidden = [];
  const seen = new Set();
  dataSteps
    .filter(({ pageId }) => pageId === first.pageId)
    .forEach(({ blockId, value }) => {
      // A value the outsider's organization also holds (a shared status) is
      // not a leak when it shows.
      if (seen.has(value) || outsiderStrings.some((text) => text.includes(value))) return;
      seen.add(value);
      hidden.push({
        expect: {
          hidden: type.isNull(blockId) ? { containing: value } : { blockId, containing: value },
        },
      });
    });
  if (hidden.length === 0) {
    return {
      skipped: `every fixture value the journey uses is also in ${outsiderOrganizationId}'s fixtures`,
    };
  }
  const visible = type.isNull(first.blockId)
    ? { containing: outsiderValue }
    : { blockId: first.blockId, containing: outsiderValue };
  return [
    {
      kind: 'tenant',
      detail: `as ${outsiderName} of ${outsiderOrganizationId}`,
      overrides: { user: outsiderName },
      steps: [...journey.steps.slice(0, first.index), { expect: { visible } }, ...hidden],
    },
  ];
}

export default tenant;
