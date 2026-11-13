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

import { isExpectedError } from '@lowdefy/errors';
import {
  findActionErrors,
  findErrorEntries,
  isAppErrorFinding,
  keyFindings,
} from '@lowdefy/node-utils';

import toEntry from './toEntry.js';

// The app errors of a headless journey, step by step, judged by the invariants the browser runner
// shares (@lowdefy/node-utils): each step's window holds the trace payloads of the events that
// completed in it (onTrace, from every actor's lowdefy object) and the errors the host's error
// sink took in it. Within a window:
// - a completed event that failed with an error that is not an expected outcome is an
//   action-error;
// - an error the client's handleError or logger took is a client-error, unless it is an expected
//   outcome (a UserError, an auth refusal) or one the server already logged (handled);
// - a fault the server logged for a call is a server-error, or an environment finding when
//   usesSearchStage(entry) says its request or endpoint uses a search stage.
// take({ pageId, withEmits }) closes the window, opens the next and returns its app-error
// findings; withEmits false judges only its errors, as the browser judges a page's open.
function createAppErrorWindows({ configDirectory, errorSink, usesSearchStage }) {
  const emits = [];
  let emitStart = 0;
  // The host's sink outlives a journey: only what this journey caused is judged.
  let errorStart = errorSink.errors.length;

  function onTrace(payload) {
    emits.push({
      blockId: payload.blockId ?? null,
      blockType: payload.blockType ?? null,
      eventName: payload.eventName ?? null,
      failure: payload.failure ?? null,
      pageId: payload.pageId ?? null,
      scope: payload.scope ?? null,
      success: payload.success,
    });
  }

  async function take({ pageId, withEmits = true }) {
    const windowEmits = withEmits ? emits.slice(emitStart) : [];
    const windowErrors = errorSink.errors.slice(errorStart);
    emitStart = emits.length;
    errorStart = errorSink.errors.length;
    const clientEntries = windowErrors
      .filter(({ source }) => source === 'client' || source === 'logger')
      .filter(({ error }) => !isExpectedError(error) && error?.handled !== true)
      .map((entry) => toEntry(entry));
    const serverEntries = windowErrors
      .filter(({ source }) => source === 'server')
      .map((entry) => toEntry(entry));
    const drafts = [
      ...(await findActionErrors({ emits: windowEmits, resolveSource: async () => null })),
      ...findErrorEntries({ clientEntries, serverEntries, usesSearchStage }),
    ];
    return keyFindings({ configDirectory, drafts, pageId }).filter(isAppErrorFinding);
  }

  return { onTrace, take };
}

export default createAppErrorWindows;
