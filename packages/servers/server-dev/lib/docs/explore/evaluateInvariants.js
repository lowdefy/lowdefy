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

import { expectedErrorNames } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import findingKey from './findingKey.js';
import parseAppApiUrl from './parseAppApiUrl.js';
import relativeSource from './relativeSource.js';

const SEVERITY = {
  'action-error': 'error',
  'client-error': 'error',
  'server-error': 'error',
  'request-failed': 'error',
  'dead-click': 'warning',
  environment: 'info',
};

function describeTarget(target) {
  const parts = [target.blockId ?? 'control'];
  if (!type.isNone(target.text)) parts.push(`"${target.text}"`);
  if (!type.isNone(target.row)) parts.push(`row ${target.row}`);
  return parts.join(' ');
}

function isExplained({ response, serverEntries, basePath }) {
  const called = parseAppApiUrl({ url: response.url, basePath });
  return serverEntries.some(
    (entry) =>
      (!type.isNone(called?.requestId) &&
        entry.requestId === called.requestId &&
        entry.pageId === called.pageId) ||
      (!type.isNone(called?.endpointId) && entry.endpointId === called.endpointId)
  );
}

function isDeadClick({ step, result, window }) {
  return (
    !type.isUndefined(step.click) &&
    result.status === 'ok' &&
    window.mutationCount === 0 &&
    window.emits.length === 0 &&
    window.requests.length === 0 &&
    window.urlBefore === window.urlAfter
  );
}

// The fixed checks that decide whether a walk step broke something, over what
// the step's window produced for this walk only (never the model):
//   action-error    an event failed with an error that is not an expected
//                   outcome: a failed Validate (a UserError) or an auth gate's
//                   401 or 403 refusal is the app doing its job
//   client-error    an uncaught page error, or a client error entry this walk
//                   caused
//   server-error    a server error entry this walk caused
//   request-failed  a 5xx from the app's request or endpoint routes that no
//                   server error entry in the window explains
//   dead-click      a click that succeeded and changed nothing: no event, no
//                   lasting DOM change, no app request, no URL change
//   environment     a server error from a request using a $search or
//                   $vectorSearch stage, which the data set's memory store
//                   cannot run: not the app's fault
// window: { emits, mutationCount (null when the document was replaced),
// urlBefore, urlAfter, pageErrors, requests, responses, errors (walk-claimed
// error entries, each with store 'client' or 'server') }. usesSearchStage
// (entry) and resolveSource(configKey) read the dev server's build. Sources
// are made relative to configDirectory. Returns findings { kind, severity,
// message, pageId, source, configKey, key }, one per key.
async function evaluateInvariants({
  step,
  result,
  window,
  pageId,
  basePath = '',
  configDirectory,
  usesSearchStage,
  resolveSource,
}) {
  let findings = [];
  function add({ kind, message, source = null, configKey = null }) {
    findings.push({
      kind,
      severity: SEVERITY[kind],
      message,
      pageId,
      source: relativeSource({ source, configDirectory }),
      configKey,
    });
  }

  for (const emit of window.emits) {
    if (emit.success !== false || expectedErrorNames.has(emit.failure?.errorName)) continue;
    const { actionId, actionType, configKey, errorName } = emit.failure ?? {};
    add({
      kind: 'action-error',
      message: `${actionType ?? 'An action'} "${actionId ?? 'unknown'}" failed in ${emit.blockId}.${
        emit.eventName
      } with ${errorName ?? 'an error'}.`,
      configKey: configKey ?? null,
      source: type.isNone(configKey) ? null : await resolveSource(configKey),
    });
  }

  const clientEntries = window.errors.filter((entry) => entry.store === 'client');
  const serverEntries = window.errors.filter((entry) => entry.store === 'server');
  clientEntries.forEach((entry) => {
    add({ kind: 'client-error', message: entry.message ?? entry.name, source: entry.source });
  });
  window.pageErrors
    .filter((pageError) => !clientEntries.some((entry) => entry.message === pageError.message))
    .forEach((pageError) => {
      add({ kind: 'client-error', message: `${pageError.name}: ${pageError.message}` });
    });
  serverEntries.forEach((entry) => {
    add({
      kind: usesSearchStage(entry) ? 'environment' : 'server-error',
      message: entry.message ?? entry.name,
      source: entry.source,
    });
  });
  window.responses
    .filter((response) => response.status >= 500)
    .filter((response) => !isExplained({ response, serverEntries, basePath }))
    .forEach((response) => {
      add({
        kind: 'request-failed',
        message: `${response.method} ${new URL(response.url).pathname} answered ${
          response.status
        }.`,
      });
    });
  if (isDeadClick({ step, result, window })) {
    add({
      kind: 'dead-click',
      message: `Clicking ${describeTarget(
        step.click
      )} did nothing: no event ran, the page did not change and no request was sent.`,
    });
  }

  if (findings.some((finding) => finding.kind === 'environment')) {
    findings = findings.filter((finding) => finding.kind === 'environment');
  }
  const seen = new Set();
  return findings
    .map((finding) => ({ ...finding, key: findingKey(finding) }))
    .filter((finding) => {
      if (seen.has(finding.key)) return false;
      seen.add(finding.key);
      return true;
    });
}

export default evaluateInvariants;
