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

// Reports the faults a :try with a :catch collected (`faults`, each { context, error }, the
// context being the one the fault was raised in, a nested endpoint's included) once the try has
// ended with `res`. A fault counts as caught only when the routine went on without it: the try
// ends with no error, or with an expected outcome the :catch chose (a :throw of a message, a
// :reject). When it ends with any other error, the :catch passed the fault on, as
// `:throw: { _error: true }` rethrows it, or failed with an error of its own. An enclosing :try
// with a :catch (routineContext.caught) then decides for it; with none, the fault escaped the
// routine and is reported as not caught. `caught` tells the server's error sink which it is: it is
// logged and sent to error tracking either way, and a journey judges a caught fault by the
// routine's answer instead of failing on it.
async function settleCaughtFaults({ faults, res, routineContext }) {
  const passedOn = res.status === 'error' && !isExpectedError(res.error);
  if (passedOn && routineContext.caught === true) {
    routineContext.caughtFaults.push(...faults);
    return;
  }
  for (const { context, error } of faults) {
    await context.handleError(error, { caught: !passedOn });
  }
}

export default settleCaughtFaults;
