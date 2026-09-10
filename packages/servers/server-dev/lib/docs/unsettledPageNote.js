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

// The note every headless tool attaches alongside `ready: false`, so an agent
// reading the result knows it is looking at a page mid-flight rather than the
// page's settled truth.
function unsettledPageNote({ timeout }) {
  return `Page did not settle within ${timeout}ms — onMountAsync, a request or a subscription is still running. The result below is a snapshot of an unsettled page.`;
}

export default unsettledPageNote;
