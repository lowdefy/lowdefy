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

// Walks click Save and Delete, so on an app with MongoDBCollection
// connections they run on a data set unless --live-data says otherwise.
// Returns { error } when the run must not walk, { warning } naming the
// connections --live-data will write to, or {}.
function checkLiveDataRule({ dataName, liveConnections, liveData }) {
  if (dataName !== null || liveConnections.length === 0) return {};
  if (!liveData) {
    return {
      error:
        "Walks click Save and Delete. Name a data set (tests/data/<name>.yaml) so they write to a disposable copy, or pass --live-data to write to what the app's connections point at.",
    };
  }
  return { warning: `--live-data: walks write to ${liveConnections.join(', ')}.` };
}

export default checkLiveDataRule;
