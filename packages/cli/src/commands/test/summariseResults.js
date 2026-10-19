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

function skippedText({ skipped }) {
  return skipped > 0 ? `, ${skipped} deprecated skipped` : '';
}

// The closing line of a run: how many journeys passed, were flaky and
// failed, and how many `deprecated: true` journeys it skipped. `failed`
// counts flaky journeys too, since either fails the run.
function summariseResults({ results, skipped }) {
  const passed = results.filter((result) => result.class === 'PASS').length;
  const flaky = results.filter((result) => result.class === 'FLAKY').length;
  const failed = results.length - passed - flaky;
  const skippedSuffix = skippedText({ skipped });
  if (flaky === 0) {
    return {
      failed,
      text: `${passed} passed, ${failed} failed of ${results.length} journeys${skippedSuffix}`,
    };
  }
  return {
    failed: failed + flaky,
    text: `${passed} passed, ${flaky} flaky, ${failed} failed of ${results.length} journeys${skippedSuffix}`,
  };
}

export default summariseResults;
