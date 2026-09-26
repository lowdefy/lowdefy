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

import { ConfigError } from '@lowdefy/errors';

// Content without a policy fails on the build or fragment check's own error,
// which already names the Dynamic block. Policy violations are listed with the
// path and rule of each, and kept on the error for logging.
function createContentError({ block, errors, pageId, policy }) {
  if (policy === null) {
    return errors[0].cause;
  }
  const lines = errors.map((error) => `  - ${error.path}: ${error.message} [${error.rule}]`);
  const contentError = new ConfigError(
    `Dynamic block "${
      block.blockId
    }" on page "${pageId}" resolved content violates dynamic blocks policy "${
      policy.id
    }":\n${lines.join('\n')}`,
    { configKey: block['~k'] }
  );
  contentError.policyErrors = errors.map(({ path, rule, message }) => ({ path, rule, message }));
  return contentError;
}

export default createContentError;
