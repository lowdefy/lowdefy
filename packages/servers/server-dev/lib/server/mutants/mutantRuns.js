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

import crypto from 'node:crypto';
import { type } from '@lowdefy/helpers';

import { JOURNEY_COOKIES, readJourneyCookie } from '../journeyCookies.js';

// The open mutant runs, one per journey run that carries a mutant. Kept on
// globalThis because the journey route that opens a run and the API context
// that reads it may load as separate module instances in one process (Vite's
// SSR module graph and Node's), like the journey actor token.
const REGISTRY_KEY = Symbol.for('lowdefy.devServer.mutantRuns');
globalThis[REGISTRY_KEY] ??= new Map();
const registry = globalThis[REGISTRY_KEY];

// Registers a run for one mutant. The cookie payload is the run id: every
// request a journey's browser contexts send carries it, and the dev server
// serves those requests the mutated artifact. close() ends the run.
function openMutantRun({ mutant }) {
  const id = crypto.randomBytes(16).toString('hex');
  const run = { id, mutant, applied: 0, misses: [] };
  registry.set(id, run);
  return {
    id,
    run,
    cookiePayload: id,
    close: () => {
      registry.delete(id);
    },
  };
}

// The open run a request's verified mutant cookie names, or null: no cookie, a
// forged token, or a run that has closed.
function readMutantRun(cookieHeader) {
  const id = readJourneyCookie({ cookieHeader, name: JOURNEY_COOKIES.mutant.name });
  if (type.isNone(id)) {
    return null;
  }
  return registry.get(id) ?? null;
}

export { openMutantRun, readMutantRun };
