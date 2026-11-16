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

function write(message) {
  process.stderr.write(`[@lowdefy/test-utils] ${message}\n`);
}

// The logger the data store and data sessions report on: a MongoDB download before the first
// run, and background work that outlived its session. Both are rare and both explain a slow or
// odd run, so they go to stderr, which a test runner shows with the file's output.
const storeLogger = { info: write, warn: write };

export default storeLogger;
