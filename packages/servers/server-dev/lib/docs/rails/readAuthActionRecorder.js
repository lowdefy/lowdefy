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

// Serialized into the journey's page by page.evaluate, so this function must be
// pure: it may reference nothing but `window` and its argument.
//
// Reads, and clears, the auth methods installAuthActionRecorder noted since it
// was installed, in call order.
function readAuthActionRecorder({ key }) {
  try {
    const called = JSON.parse(window.sessionStorage.getItem(key) ?? '[]');
    window.sessionStorage.removeItem(key);
    return called;
  } catch (error) {
    return [];
  }
}

export default readAuthActionRecorder;
