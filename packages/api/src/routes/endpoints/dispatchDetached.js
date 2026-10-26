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

// /api/detached answers 202 once it has accepted the run. Anything else - a 401 for a CRON_SECRET
// the deployment does not share, a 500 - means the target never ran, which is a fault, not a
// completed dispatch.
async function dispatchDetached(url, init) {
  const response = await fetch(url, init);
  // Drain the body so the connection is released; the route's own log holds the detail.
  await response.arrayBuffer();
  if (!response.ok) {
    const error = new Error(
      `Detached call to ${url} answered ${response.status}, so the target endpoint did not run.`
    );
    error.statusCode = response.status;
    throw error;
  }
  return response;
}

export default dispatchDetached;
