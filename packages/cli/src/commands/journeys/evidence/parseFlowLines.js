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

// flowLines's inverse: the `[{ page, identity }]` sequence isBackedBy matches
// segments against. An identity is a JSON array, so the page ends at the
// first " [".
function parseFlowLines({ flow }) {
  return flow.map((line) => {
    const at = line.indexOf(' [');
    return { page: line.slice(0, at), identity: line.slice(at + 1) };
  });
}

export default parseFlowLines;
