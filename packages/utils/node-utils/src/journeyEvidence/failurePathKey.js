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

// The key a failure path is ranked and covered by: `<page>.<block>.<event>`,
// `app.<event>` for an app event, with the invalid blocks a Validate named
// in brackets.
function failurePathKey({ path }) {
  const event =
    path.page === 'app' ? `app.${path.event}` : `${path.page}.${path.block_id}.${path.event}`;
  return path.invalid_blocks.length === 0 ? event : `${event} [${path.invalid_blocks.join(', ')}]`;
}

export default failurePathKey;
