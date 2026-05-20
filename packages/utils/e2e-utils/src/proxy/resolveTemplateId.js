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

// Convert a runtime blockId (e.g. `legal_rows.0.toggle`) into the template form
// stored in the e2e manifest (`legal_rows.$.toggle`) by replacing each integer-only
// dot-separated segment with `$`. Mixed segments like `step_1d` are left as-is.
function resolveTemplateId(blockId) {
  return blockId
    .split('.')
    .map((segment) => (/^\d+$/.test(segment) ? '$' : segment))
    .join('.');
}

export default resolveTemplateId;
