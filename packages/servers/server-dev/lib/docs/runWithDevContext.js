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

import { ConfigError } from '@lowdefy/errors';

import resolveDevUser from '../server/auth/resolveDevUser.js';
import truncateResponse from './truncateResponse.js';

// The shared tail of the two execution tools (run_request, run_endpoint):
// resolve the caller, build the context, run, truncate, and shape a fault.
// They are siblings by design and drifted apart once already — the caller was
// resolved differently, only one reported `source`, and only one reached the
// server's error sink. One tail means a fix lands for both.
//
// `run` receives the built context and the trace collector (undefined unless
// `explain` is true), and `formatExplain` shapes that collector for the result.
async function runWithDevContext({
  createTrace,
  explain,
  formatExplain,
  honoContext,
  log,
  run,
  user,
}) {
  // A fixture name declared under auth.dev.users, or an inline caller object -
  // resolveDevUser is the single place a `user` value becomes a caller, and an
  // unknown name names the fix rather than falling back to a roleless caller.
  let caller;
  try {
    caller = resolveDevUser({ user });
  } catch (error) {
    throw new ConfigError(error.message, { cause: error });
  }

  // Deferred import: createLowdefyContext statically imports build/plugins/*
  // artifacts, which only exist in a running server directory — importing it
  // at module load would break every consumer of this module (e.g. the MCP
  // server) in environments without a full build.
  const { default: createLowdefyContext } = await import('../server/createLowdefyContext.js');
  const context = await createLowdefyContext({ c: honoContext, user: caller });
  log({ context });

  const trace = explain === true ? createTrace() : undefined;
  try {
    const result = await run({ context, trace });
    if (trace) {
      return {
        refused: false,
        ...truncateResponse(result),
        explain: formatExplain({ context, trace }),
      };
    }
    return { refused: false, ...truncateResponse(result) };
  } catch (error) {
    // The server's error sink resolves the config source onto the error and
    // records it in serverErrorStore, so a failed agent run appears under
    // build_status like every other server error — and the `source` below is
    // the file:line it just resolved.
    await context.handleError(error);
    const failure = {
      refused: false,
      error: {
        name: error.name,
        message: error.message,
        source: error.source ?? null,
        configKey: error.configKey ?? null,
      },
    };
    if (trace) {
      // The trace up to the failure still names the caller, the tenancy and
      // the wall's rewrites - usually the reason a run was refused.
      failure.explain = formatExplain({ context, trace });
    }
    return failure;
  }
}

export default runWithDevContext;
