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

const POLL_MS = 25;

// Waits, up to timeoutMs, until no client error report the journey's pages sent
// is still in flight, so an error the step caused lands in the run's error buffer
// before the step's window closes. A short grace first lets a report the
// page is about to send start.
async function waitForClientErrorReports({ events, graceMs = 100, timeoutMs = 2000 }) {
  await new Promise((resolve) => setTimeout(resolve, graceMs));
  const deadline = Date.now() + timeoutMs;
  while (events.pendingClientErrors.size > 0 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

export default waitForClientErrorReports;
