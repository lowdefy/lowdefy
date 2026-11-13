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

// Releases what the test app holds: the build files and config it read. Calls on a closed app
// are refused, so a test never reads a build its file already let go of.
function closeTestApp({ testApp }) {
  testApp.closed = true;
  testApp.accessConfig = null;
  testApp.fileCache.clear();
}

export default closeTestApp;
