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

const BUILD_HEADER = 'x-lowdefy-build';

/**
 * The fetch the core's requests and endpoint calls go through.
 *
 * - A page request carries the build of the root the shell holds (the core stamps the build it was
 *   created with; the shell keeps it current without rebuilding the core).
 * - The server refuses a page request from another build with a 409. The shell then syncs: it
 *   refetches the root and the changed pages. When the request's own page did not change with the
 *   build, its payload is still the shape the new build expects, so the request is retried once,
 *   stamped with the new build. When the page changed, the 409 goes to the core, which hands it to
 *   onBuildChanged: the screen is rebuilt on the new page and runs its requests again.
 * - A request sent with `keepBuild: true` (the offline queue's, stamped with the build it was
 *   queued under) keeps its stamp, so a request from an older build gets the 409 and its check.
 *
 * @param {Object} params
 * @param {Function} params.fetch The Fetch API, sending the shell header (withShellHeader).
 * @param {Object} params.session The app session (createAppSession).
 */
function createShellFetch({ fetch, session }) {
  return async function shellFetch(url, { keepBuild = false, ...init } = {}) {
    const headers = { ...init.headers };
    const stamped = headers[BUILD_HEADER] !== undefined;
    if (stamped && !keepBuild) {
      headers[BUILD_HEADER] = session.getState().buildId ?? headers[BUILD_HEADER];
    }
    const res = await fetch(url, { ...init, headers });
    if (res.status !== 409 || !stamped) {
      return res;
    }
    const before = session.getRequestPageEntry(url);
    try {
      await session.sync();
    } catch (error) {
      return res;
    }
    const after = session.getRequestPageEntry(url);
    if (before === null || after === null || before.hash !== after.hash) {
      return res;
    }
    const buildId = session.getState().buildId ?? headers[BUILD_HEADER];
    return fetch(url, { ...init, headers: { ...headers, [BUILD_HEADER]: buildId } });
  };
}

export default createShellFetch;
