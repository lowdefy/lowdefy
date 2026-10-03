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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

function toCompactYaml(value) {
  if (type.isUndefined(value)) {
    return 'undefined';
  }
  const document = new YAML.Document(value);
  if (!type.isNone(document.contents) && type.isObject(document.contents)) {
    document.contents.flow = true;
  }
  return document.toString({ lineWidth: 0 }).trim();
}

function describeStep(step) {
  if (!type.isObject(step)) {
    return toCompactYaml(step);
  }
  const [key] = Object.keys(step);
  const value = step[key];
  if (type.isString(value)) {
    return `${key} "${value}"`;
  }
  return `${key} ${toCompactYaml(value)}`;
}

function failureDetail({ failure, message }) {
  if (type.isObject(failure)) {
    return `step ${failure.index} (${describeStep(failure.step)}): ${failure.message ?? ''}`;
  }
  return message ?? '';
}

function failureLines({ failure, message }) {
  const lines = [];
  if (type.isObject(failure)) {
    lines.push(`      step ${failure.index}: ${toCompactYaml(failure.step)}`);
    if (!type.isUndefined(failure.expected) || !type.isUndefined(failure.actual)) {
      lines.push(`      expected: ${toCompactYaml(failure.expected)}`);
      lines.push(`      actual:   ${toCompactYaml(failure.actual)}`);
    }
    if (type.isString(failure.message) && failure.message !== '') {
      lines.push(`      ${failure.message}`);
    }
    return lines;
  }
  if (type.isString(message) && message !== '') {
    lines.push(`      ${message}`);
  }
  return lines;
}

function formatSingle({ result }) {
  if (result.passed) {
    return [`PASS  ${result.name}  (${result.stepCount} steps, ${result.durationMs}ms)`];
  }
  return [
    `FAIL  ${result.name}`,
    `      file: ${result.filePath}`,
    ...failureLines({ failure: result.failure, message: result.message }),
  ];
}

function formatRepeated({ result }) {
  const seconds = (result.durationMs / 1000).toFixed(1);
  if (result.class === 'PASS') {
    return [
      `PASS   ${result.name}   (${result.stepCount} steps, ${result.passedRuns}/${result.runs}, ${seconds}s each)`,
    ];
  }
  const [first, ...others] = result.failures;
  if (result.class === 'FLAKY') {
    return [
      `FLAKY  ${result.name}   (${result.passedRuns}/${result.runs} passed) run ${
        first.run
      } failed at ${failureDetail(result)}`,
      `      file: ${result.filePath}`,
      ...failureLines({ failure: result.failure, message: result.message }),
      ...others.map(
        (failure) => `      run ${failure.run} failed at step ${failure.step}: ${failure.message}`
      ),
    ];
  }
  return [
    `FAIL   ${result.name}   (0/${result.runs}) ${failureDetail(
      result
    )} — fails every run: a finding, not a test to fix by retrying`,
    `      file: ${result.filePath}`,
    ...failureLines({ failure: result.failure, message: result.message }),
  ];
}

// Returns the lines to print for one journey result. Run once, a single PASS
// line, or a FAIL line followed by an indented explanation of what went
// wrong. Replayed (--repeat above 1), the class - PASS, FLAKY or FAIL - with
// the runs that passed, and each failing run's step.
function formatJourneyResult({ result }) {
  if ((result.repeat ?? 1) === 1 || result.refused === true) {
    return formatSingle({ result });
  }
  return formatRepeated({ result });
}

export default formatJourneyResult;
