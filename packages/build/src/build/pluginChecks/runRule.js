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

import getOperatorParams from './getOperatorParams.js';

// The messages one rule gives for one node. A rule that throws, or returns
// anything but null, a string or a list of strings, gives one message saying
// so, so the build still reports it at the node and checks the other nodes.
function runRule({ rule, packageName, kind, typeName, node }) {
  const input = { node, type: typeName, kind };
  if (kind === 'operators') {
    input.params = getOperatorParams(node);
  }
  const failed = (reason) => [`Plugin check ${rule.id} (${packageName}) failed: ${reason}`];
  let result;
  try {
    result = rule.check(input);
  } catch (error) {
    return failed(error?.message ?? String(error));
  }
  if (type.isNull(result)) {
    return [];
  }
  if (type.isString(result)) {
    return [result];
  }
  if (type.isArray(result) && result.every((message) => type.isString(message))) {
    return result;
  }
  return failed(
    `check returned ${JSON.stringify(result)}; expected null, a message or a list of messages.`
  );
}

export default runRule;
