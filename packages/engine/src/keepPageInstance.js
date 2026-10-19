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

const instancesPerPage = 10;

// Marks a page instance as the most recently rendered of its page. A page keeps its 10 most
// recently rendered instances: the least recently used beyond that is dropped with its input, so
// returning to it is a first visit.
function keepPageInstance({ lowdefy, pageId, instanceKey }) {
  const kept = (lowdefy.pageInstances[pageId] ?? []).filter((key) => key !== instanceKey);
  kept.push(instanceKey);
  while (kept.length > instancesPerPage) {
    const dropped = kept.shift();
    delete lowdefy.contexts[dropped];
    delete lowdefy.inputs[dropped];
  }
  lowdefy.pageInstances[pageId] = kept;
}

export default keepPageInstance;
