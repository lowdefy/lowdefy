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

import findTemplateRefs from '@lowdefy/blocks-antd/table/findTemplateRefs.js';

// An ai column's picker inputs kept in step with its prompt: one `{ column }` input per column the
// prompt references (`{{ key }}`, the chips insert them), in order, and nothing else. The server
// renders the prompt from `inputs` and never parses it, so a reference without an input would
// render empty.
function syncPromptInputs({ prompt, columnKeys }) {
  const keys = new Set(columnKeys);
  const inputs = {};
  findTemplateRefs(prompt)
    .filter((ref) => keys.has(ref))
    .forEach((ref) => {
      inputs[ref] = { mode: 'column', column: ref };
    });
  return inputs;
}

export default syncPromptInputs;
