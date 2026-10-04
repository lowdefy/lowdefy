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
import { collectKnownText, getStepKey } from '@lowdefy/node-utils';

import describeStep from './describeStep.js';
import getL7PageIds from './getL7PageIds.js';

const TARGET_STEPS = ['click', 'open', 'fill', 'select'];

function stringLeaves({ value, path, leaves = [] }) {
  if (type.isString(value)) {
    leaves.push({ path, value });
  } else if (type.isArray(value)) {
    value.forEach((item, index) => stringLeaves({ value: item, path: `${path}.${index}`, leaves }));
  } else if (type.isObject(value)) {
    Object.entries(value).forEach(([key, item]) =>
      stringLeaves({ value: item, path: `${path}.${key}`, leaves })
    );
  }
  return leaves;
}

// The values a target selects by: `text` must be exactly a known string,
// `containing` a part of one.
function targetValues(target) {
  if (!type.isObject(target)) return [];
  const values = [];
  if (type.isString(target.text)) {
    values.push({ label: 'text', value: target.text, exact: true });
  }
  if (type.isString(target.containing)) {
    values.push({ label: 'containing', value: target.containing, exact: false });
  }
  return values;
}

function expectValues(expectation) {
  const key = getStepKey(expectation);
  const value = expectation[key];
  switch (key) {
    case 'visible':
    case 'hidden':
      return targetValues(value);
    case 'text':
      return [...targetValues(value), { label: 'contains', value: value.contains, exact: false }];
    case 'title':
      return type.isString(value.equals)
        ? [{ label: 'title equals', value: value.equals, exact: true }]
        : [{ label: 'title contains', value: value.contains, exact: false }];
    case 'state':
      // A placeholder is L1's to refuse; booleans, numbers and null are not
      // text and pass.
      if (value.from === 'shape') return [];
      return stringLeaves({ value: value.equals, path: 'equals' }).map((leaf) => ({
        label: `state ${value.path} ${leaf.path}`,
        value: leaf.value,
        exact: true,
      }));
    default:
      return [];
  }
}

// The values one step selects or asserts by, each { label, value, exact }.
function stepValues(step) {
  const key = getStepKey(step);
  const params = step[key];
  if (TARGET_STEPS.includes(key)) {
    const values = targetValues(params);
    if (key === 'select' && type.isString(params.value)) {
      values.push({ label: 'value', value: params.value, exact: true });
    }
    return values;
  }
  if (key === 'expect') {
    return expectValues(params);
  }
  if (key === 'goto' && type.isObject(params)) {
    return stringLeaves({ value: params.urlQuery, path: 'urlQuery' }).map((leaf) => ({
      label: leaf.path,
      value: leaf.value,
      exact: true,
    }));
  }
  return [];
}

function stepTarget(step) {
  const key = getStepKey(step);
  if (TARGET_STEPS.includes(key)) return step[key];
  if (key === 'expect') {
    const expectKey = getStepKey(step.expect);
    if (['visible', 'hidden', 'text'].includes(expectKey)) return step.expect[expectKey];
  }
  return null;
}

// L7 (on data sets with a snapshot): no journey value comes from the
// snapshot. A snapshot is pulled per developer, at different times, from a
// database others keep editing, so a journey that selects or asserts a
// snapshot value passes on one pull and fails on a colleague's.
//
// (a) Every value the journey selects or asserts by must be known text:
//     collectKnownText's set over the exercised pages' built config, menus,
//     the default locale's messages and the data set's fixtures and users,
//     plus whatever an earlier fill typed (create a record, then find it).
// (b) A typed value is free unless it is a string found only in the pulled
//     snapshot. Without a local pull this is skipped with a note.
// (c) A grid row picked by index is whatever row the snapshot sorts there.
//
// `pageErrors` maps a page that could not be built to its error; the pages
// must be built for their config to be read from `buildDirectory`.
function L7({ journey, exercisedEntry, dataSet, buildDirectory, snapshotStrings, pageErrors }) {
  if (type.isNone(dataSet) || type.isNone(dataSet.snapshotSpec)) {
    return [];
  }
  const pageIds = getL7PageIds({ journey, exercisedEntry });
  const unbuilt = pageIds.filter((pageId) => !type.isNone(pageErrors?.[pageId]));
  if (unbuilt.length > 0) {
    return unbuilt.map((pageId) => ({
      severity: 'error',
      message: `not checked for snapshot values: page "${pageId}" could not be built. ${pageErrors[pageId]}`,
    }));
  }
  const known = collectKnownText({ buildDirectory, pageIds, dataSet, typed: [] });
  const typed = new Set();
  const snapshotOnly = type.isNone(snapshotStrings)
    ? null
    : new Set([...snapshotStrings].filter((text) => !known.has(text)));

  function isAllowed({ value, exact }) {
    const text = value.trim();
    if (exact) {
      return known.has(text) || typed.has(text);
    }
    return [...known.values, ...typed].some((allowed) => allowed.includes(text));
  }

  const problems = [];
  function refuse({ where, stepIndex, label, value, exact }) {
    const rule = exact ? 'is not' : 'is not part of';
    problems.push({
      severity: 'error',
      ...(type.isUndefined(stepIndex) ? {} : { stepIndex }),
      message: `${where} ${label} "${value}" ${rule} the app's text, a fixture or user of data set "${dataSet.name}", or an earlier fill: on a snapshot data set it may exist in only one pull. Use a fixture value.`,
    });
  }

  stringLeaves({ value: journey.urlQuery, path: 'urlQuery' }).forEach((leaf) => {
    if (!isAllowed({ value: leaf.value, exact: true })) {
      refuse({ where: 'the journey', label: leaf.path, value: leaf.value, exact: true });
    }
  });

  let typingNoted = false;
  journey.steps.forEach((step, index) => {
    const where = describeStep({ step, index });
    stepValues(step).forEach(({ label, value, exact }) => {
      if (!isAllowed({ value, exact })) {
        refuse({ where, stepIndex: index, label, value, exact });
      }
    });
    const target = stepTarget(step);
    if (type.isObject(target) && !type.isUndefined(target.row) && type.isNone(target.containing)) {
      problems.push({
        severity: 'error',
        stepIndex: index,
        message: `${where} picks row ${target.row} on snapshot data: use containing: <fixture value>.`,
      });
    }
    if (getStepKey(step) !== 'fill' || !type.isString(step.fill.value)) {
      return;
    }
    const text = step.fill.value.trim();
    if (snapshotOnly === null) {
      if (!typingNoted) {
        typingNoted = true;
        problems.push({
          severity: 'info',
          message: `typed values not checked: data set "${dataSet.name}" has no snapshot pulled on this machine (lowdefy data pull ${dataSet.name}).`,
        });
      }
    } else if (snapshotOnly.has(text)) {
      problems.push({
        severity: 'error',
        stepIndex: index,
        message: `${where} types "${text}", which only the pulled snapshot of data set "${dataSet.name}" holds: type a fixture value or new text.`,
      });
    }
    if (text !== '') typed.add(text);
  });
  return problems;
}

export default L7;
