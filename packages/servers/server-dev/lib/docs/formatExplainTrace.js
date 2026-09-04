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

// A secret shorter than this is not redacted inside a larger string: a short
// value ("dev", "1234") occurs by chance in ids, collection names and queries,
// and redacting those would hide the very thing the explain exists to show. An
// exact match is redacted at any length.
const MIN_INTERPOLATED_SECRET_LENGTH = 9;

// The evaluated request properties are what `explain` exists to show, but they
// are evaluated - a `_secret` reference in a header or a databaseUri has been
// replaced by its value by the time the trace records them. The normal
// response path never returns them; the explain must not become the one place
// a secret reaches an agent transcript, a model provider and a log.
function redactSecrets(value, secretValues) {
  if (type.isString(value)) {
    let redacted = value;
    for (const secret of secretValues) {
      if (redacted === secret) return '[redacted secret]';
      if (secret.length >= MIN_INTERPOLATED_SECRET_LENGTH && redacted.includes(secret)) {
        redacted = redacted.split(secret).join('[redacted secret]');
      }
    }
    return redacted;
  }
  if (type.isArray(value)) {
    return value.map((item) => redactSecrets(item, secretValues));
  }
  if (type.isObject(value)) {
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = redactSecrets(value[key], secretValues);
    }
    return result;
  }
  return value;
}

function secretStrings(secrets) {
  if (!type.isObject(secrets)) return [];
  return Object.values(secrets).filter((value) => type.isString(value) && value !== '');
}

// Shapes the trace an `explain: true` run collected into the object returned to
// the agent. `caller` carries exactly id, organization_id and roles - an explain
// must not become a way to dump a session. The request type is read off the
// trace, which the request layer records; `requestType` is the caller's
// fallback for a trace that was never given one.
function formatExplainTrace({ trace, requestType, secrets, user }) {
  const secretValues = secretStrings(secrets);
  const explain = {
    caller: {
      id: user?.id ?? null,
      organization_id: user?.organization_id ?? null,
      roles: user?.roles ?? [],
    },
    connection: trace.connection ?? null,
    properties: redactSecrets(trace.properties ?? null, secretValues),
    effective: type.isUndefined(trace.effective)
      ? null
      : redactSecrets(trace.effective, secretValues),
    rewritten: trace.rewritten,
  };
  if (type.isUndefined(trace.effective)) {
    // trace.dispatched is set where the resolver is called, so a run that
    // failed earlier - an operator error, a wall refusal, a schema violation -
    // is not reported as a request type that keeps no effective query.
    explain.note =
      trace.dispatched === true
        ? `Request type ${trace.requestType ?? requestType} does not report an effective query.`
        : 'The request did not reach the driver — it failed before the resolver ran, so there is no effective query.';
  }
  if (!type.isUndefined(trace.stepId)) {
    return { stepId: trace.stepId, ...explain };
  }
  return explain;
}

export default formatExplainTrace;
