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

// The context.handleError of a call made by the harness. On a server this is where a fault is
// logged at error level and sent to error tracking; here each one is added to the call's
// `faults`, with its config location resolved from the build as the server's log line has it
// (error.source, "<file>:<line>"). An expected outcome, such as a refusal or a UserError,
// never gets here, as on a server.
function createFaultSink({ context, faults, testApp }) {
  const { LowdefyInternalError, loadAndResolveErrorLocation } = testApp.modules.errors;
  return async function handleError(error) {
    // Set first, as the servers do: reaching the sink is what makes the error handled.
    error.handled = true;
    if (!(error instanceof LowdefyInternalError)) {
      const location = await loadAndResolveErrorLocation({
        error,
        readConfigFile: context.readConfigFile,
      });
      if (!type.isNone(location)) {
        error.source = location.source;
        error.config = location.config;
      }
    }
    faults.push(error);
  };
}

export default createFaultSink;
