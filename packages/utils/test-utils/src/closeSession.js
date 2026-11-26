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

// Ends a session when its app closes, with the data session's own close(): held routines are
// released, background work is waited for, and the session's databases are kept for the app's
// next session on its data set (the store's stop() drops them).
async function closeSession({ testSession }) {
  if (testSession.closed) return;
  testSession.closed = true;
  await testSession.dataSession.close();
}

export default closeSession;
