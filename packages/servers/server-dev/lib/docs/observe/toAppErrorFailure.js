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
import { getStepKey } from '@lowdefy/node-utils';

function describeWhere({ phase, index, step }) {
  if (phase === 'open') {
    return 'Opening the page';
  }
  return `Step ${index} (${getStepKey(step)})`;
}

// The journey failure for the app errors a window held: the step that caused
// them (or phase 'open' for the page open, in place of index and step), each
// error with its kind, message, config source and finding key.
// When the step also failed on its own, the app error leads the message, since
// it is usually the cause, and the step's own message follows (and is kept
// apart as stepMessage).
function toAppErrorFailure({ findings, phase, index, step, stepFailure }) {
  const errors = findings.map(({ kind, message, source, configKey, key }) => ({
    kind,
    message,
    source,
    configKey,
    key,
  }));
  const actual = errors.map((error) => `${error.kind}: ${error.message}`);
  const count = errors.length === 1 ? 'an app error' : `${errors.length} app errors`;
  const message = `${describeWhere({ phase, index, step })} caused ${count}: ${actual.join('; ')}`;
  const failure = {
    kind: 'app-error',
    message,
    expected: 'no app error',
    actual,
    errors,
  };
  if (!type.isUndefined(stepFailure)) {
    failure.message = `${message}. The step also failed: ${stepFailure.message}`;
    failure.stepMessage = stepFailure.message;
  }
  if (phase === 'open') {
    return { phase: 'open', ...failure };
  }
  return { index, step, ...failure };
}

export default toAppErrorFailure;
