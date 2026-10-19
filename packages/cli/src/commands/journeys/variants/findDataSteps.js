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

import stepTarget, { targetBlockId } from './stepTarget.js';

function collectStrings({ value, strings }) {
  if (type.isString(value)) {
    if (value.trim() !== '') strings.add(value.trim());
  } else if (type.isArray(value)) {
    value.forEach((item) => collectStrings({ value: item, strings }));
  } else if (type.isObject(value)) {
    Object.values(value).forEach((item) => collectStrings({ value: item, strings }));
  }
  return strings;
}

// The fixture value a step selects or asserts by, or null: a target's
// `containing`, or its `text`, `select.value` or `expect.text.contains` when
// a fixture holds it.
function fixtureValue({ step, target, fixtureValues }) {
  if (type.isObject(target) && type.isString(target.containing)) {
    return target.containing;
  }
  const key = getStepKey(step);
  const candidates = [];
  if (type.isObject(target) && type.isString(target.text)) candidates.push(target.text);
  if (key === 'select' && type.isString(step.select.value)) candidates.push(step.select.value);
  if (key === 'expect' && getStepKey(step.expect) === 'text') {
    candidates.push(step.expect.text.contains);
  }
  return candidates.find((candidate) => fixtureValues.has(candidate.trim())) ?? null;
}

// The journey's data steps, in order, each { index, pageId, blockId, value }:
// steps whose target has `row` or `containing`, or whose `text`,
// `select.value` or `expect.text.contains` comes from the data set's
// fixtures. pageId is the page the step is on, followed through goto; value
// is the fixture value it uses, or null for a row picked by index.
function findDataSteps({ journey, dataSet }) {
  const fixtureValues = collectStrings({ value: dataSet?.fixtures, strings: new Set() });
  const dataSteps = [];
  let pageId = journey.pageId;
  journey.steps.forEach((step, index) => {
    if (getStepKey(step) === 'goto') {
      pageId = type.isString(step.goto) ? step.goto : step.goto.pageId;
      return;
    }
    const target = stepTarget(step);
    if (type.isNone(target)) return;
    const value = fixtureValue({ step, target, fixtureValues });
    const byRow = type.isObject(target) && !type.isUndefined(target.row);
    if (type.isNull(value) && !byRow) return;
    dataSteps.push({ index, pageId, blockId: targetBlockId(target), value });
  });
  return dataSteps;
}

export default findDataSteps;
