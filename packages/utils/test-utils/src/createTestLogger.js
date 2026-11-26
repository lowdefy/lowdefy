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

function ignore() {}

// The request logger of a call made by the harness. It writes nothing: a test reads what a call
// did from its answer, where the faults a server would log at error level are listed
// (createFaultSink), and a test run's output stays the runner's own.
function createTestLogger() {
  const logger = {
    debug: ignore,
    error: ignore,
    fatal: ignore,
    info: ignore,
    trace: ignore,
    warn: ignore,
  };
  logger.child = () => logger;
  return logger;
}

export default createTestLogger;
