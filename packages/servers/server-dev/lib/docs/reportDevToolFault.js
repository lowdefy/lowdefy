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

// A dev tool that throws something other than the outcome it reports (a failed
// step, an app error) has a bug of its own or lost its browser. Returned as a
// bare message, that looked to an agent like a failure of its app, and nothing
// was logged. It is logged here with its stack, and the text an agent gets says
// whose fault it is and where the stack is.
function reportDevToolFault({ error, logger, tool }) {
  logger.error({ err: error, event: 'dev_tool_fault', tool }, `The ${tool} dev tool failed.`);
  return `${error?.name ?? 'Error'}: ${
    error?.message
  } (a fault in the dev server's ${tool} tool, not in the app; the dev server terminal has the stack)`;
}

export default reportDevToolFault;
