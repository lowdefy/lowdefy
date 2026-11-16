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

// A call on a session that has closed (its app was closed) is refused before anything is read:
// its databases are gone.
function checkSessionOpen({ testSession }) {
  if (testSession.closed) {
    throw new Error('The session is closed: its test app was closed. Open a new one.');
  }
}

export default checkSessionOpen;
