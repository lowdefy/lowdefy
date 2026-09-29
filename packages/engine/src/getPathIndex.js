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

// The client renders every block inside a layout element with the id `bl-<blockId>`
// (packages/client/src/block). Its position on the DOM event's path, innermost first, or -1 when
// the event did not pass through the block.
function getPathIndex({ blockId, path }) {
  const element = document.getElementById(`bl-${blockId}`);
  if (element === null) return -1;
  return path.indexOf(element);
}

export default getPathIndex;
