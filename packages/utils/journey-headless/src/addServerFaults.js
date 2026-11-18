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

// Adds the faults of one server call to the error sink, where the runner's invariants read them
// and fail the step. A fault a :catch of the routine handled (fault.caught, set by the host's
// fault sink) is left out: the routine dealt with it and answered, so the journey judges the
// answer. This is what lets a routine run where the build host cannot do what a server can: an
// auth step has no auth engine there, and a routine that catches the failure still passes. A fault
// that escapes the routine has no :catch, and fails the step.
function addServerFaults({ call, errorSink, faults }) {
  faults
    .filter((fault) => fault.caught !== true)
    .forEach((fault) => {
      errorSink.add({ call, error: fault, source: 'server' });
    });
}

export default addServerFaults;
