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

import findSubmitClick from '../findSubmitClick.js';
import targetName from '../targetName.js';
import writeCall from '../writeCall.js';

// Double submit: the same steps with the submit click a real double click
// (click.count: 2), then the write sent once, after the original
// expectations.
function doubleSubmit({ journey, exercised }) {
  const submit = findSubmitClick({ journey, exercised });
  if (type.isNull(submit)) {
    return { skipped: 'no submit click: no click followed by a wait for a write request' };
  }
  const click = journey.steps[submit.index].click;
  const doubled = type.isString(click) ? { blockId: click, count: 2 } : { ...click, count: 2 };
  const steps = [
    ...journey.steps.slice(0, submit.index),
    { click: doubled },
    ...journey.steps.slice(submit.index + 1),
    writeCall({ write: submit.write, count: 1 }),
  ];
  return [{ kind: 'double-submit', detail: `double click "${targetName(click)}"`, steps }];
}

export default doubleSubmit;
