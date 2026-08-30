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

// Returns the lines to print for one journey result: a single PASS line, or a FAIL
// line followed by an indented explanation of what went wrong.
function formatJourneyResult({ result }) {
  if (result.passed) {
    return [`PASS  ${result.name}  (${result.stepCount} steps, ${result.durationMs}ms)`];
  }
  const lines = [`FAIL  ${result.name}`, `      file: ${result.filePath}`];
  const failure = result.failure;
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
  if (type.isString(result.message) && result.message !== '') {
    lines.push(`      ${result.message}`);
  }
  return lines;
}

export default formatJourneyResult;
