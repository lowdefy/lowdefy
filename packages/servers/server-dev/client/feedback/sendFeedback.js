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

// Sends the batch to the dev server for enrichment (blockId → yaml file:line
// via the build's keyMap) and gets back the formatted, agent-readable text.
// Best-effort, matching Inspector.jsx's postResult style — a dev-only feature
// must never throw into the app it rides along with. Returns the formatted
// string, or null on any failure.
async function sendFeedback({ basePath, batch }) {
  try {
    const response = await fetch(`${basePath}/lowdefy-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return typeof data.formatted === 'string' ? data.formatted : null;
  } catch {
    return null;
  }
}

export default sendFeedback;
