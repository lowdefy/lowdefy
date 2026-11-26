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

import holdAtPauseGate from './holdAtPauseGate.js';
import throwAtFailGate from './throwAtFailGate.js';

// Wraps a request resolver with the data session's gates: a routine is held at a pause gate
// first, then a fail gate throws before the resolver runs. Operators are evaluated and schemas
// checked before a resolver is called, so a held or failed request is built and not yet sent.
// Schema and meta stay on the wrapper, as the request route reads them from the resolver.
//
// Each call is in session.running until it settles. A call still running when the session closes
// may write after the session has let go of its databases, so close() then drops them rather than
// keep them for the next session on the data set (openDataSession).
function createGatedResolver({ resolver, session }) {
  async function gate(args) {
    await holdAtPauseGate({ args, session });
    throwAtFailGate({ args, session });
    // A call that read its connection while the session was open but reaches its resolver after
    // close() fails here, as a connection read after close() does (applyDataSetRedirect): close()
    // counted only the calls already running.
    if (session.state === 'closed') {
      throw new Error(`Data session ${session.id} has ended.`);
    }
    return resolver(args);
  }
  function gatedResolver(args) {
    const call = gate(args);
    session.running.add(call);
    const remove = () => {
      session.running.delete(call);
    };
    call.then(remove, remove);
    return call;
  }
  return Object.assign(gatedResolver, resolver);
}

export default createGatedResolver;
