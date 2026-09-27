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

// Status must answer even when the dev server has stopped responding.
const BUILD_SUMMARY_TIMEOUT_MS = 10000;

// The counts lowdefy_dev_status reports, or null when the server cannot say.
async function fetchBuildSummary({ url, timeoutMs = BUILD_SUMMARY_TIMEOUT_MS }) {
  try {
    const response = await fetch(`${url}/lowdefy-docs/build-status`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    const { build, pages, clientErrors = [], serverErrors = [] } = await response.json();
    return {
      status: build?.status,
      errors: build?.errors?.length ?? 0,
      warnings: build?.warnings?.length ?? 0,
      failedPages: pages?.failed?.length ?? 0,
      clientErrors: clientErrors.length,
      serverErrors: serverErrors.length,
    };
  } catch {
    return null;
  }
}

export default fetchBuildSummary;
