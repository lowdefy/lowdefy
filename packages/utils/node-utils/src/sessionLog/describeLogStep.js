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

import describeLogValue from './describeLogValue.js';

// A journey target as the log reads it: the blockId, then where in it (row,
// column), then the control's text in quotes and which of several it was.
function describeTarget(target) {
  if (type.isString(target)) return target;
  const parts = [];
  if (!type.isNone(target.blockId)) parts.push(target.blockId);
  if (!type.isNone(target.row)) parts.push(`row ${target.row}`);
  if (!type.isNone(target.column)) parts.push(`column ${target.column}`);
  if (!type.isNone(target.text)) parts.push(JSON.stringify(target.text));
  if (!type.isNone(target.nth)) parts.push(`nth ${target.nth}`);
  return parts.join(' ');
}

function describeFill({ fill, redacted }) {
  const target = describeTarget(fill);
  if (redacted) return `fill ${target} (password, not recorded)`;
  // Production never records typed values, so the step says only where.
  if (fill.from === 'shape') return `fill ${target}`;
  return `fill ${target} ${describeLogValue(fill.value)}`;
}

function describeSelect({ select }) {
  const target = describeTarget(select);
  if (type.isNone(select.value)) return `select ${target}`;
  return `select ${target} ${JSON.stringify(select.value)}`;
}

// One compiled journey step (compileRecord's) as a line of the session log:
// the verb, the target and the value, as a person would say what they did.
// Expectations are never steps of the log; outcomes are read from the record.
function describeLogStep({ step, record }) {
  if (!type.isUndefined(step.click)) return `click ${describeTarget(step.click)}`;
  if (!type.isUndefined(step.fill)) {
    return describeFill({ fill: step.fill, redacted: record.redacted === true });
  }
  if (!type.isUndefined(step.select)) return describeSelect({ select: step.select });
  if (!type.isUndefined(step.press)) return `press ${step.press}`;
  if (step.back === true) return 'back';
  return undefined;
}

export default describeLogStep;
