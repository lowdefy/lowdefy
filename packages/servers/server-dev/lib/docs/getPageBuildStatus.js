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

import reviewPageBuilds from './reviewPageBuilds.js';

// The page side of build status. The dev server builds a page when it is first
// requested, so the config build's status says nothing about page content:
// this reports the pages whose latest build failed, the pages changed since
// they were built, and how many pages nothing has built yet. checked is the
// list of pages build status just built (wait: true).
function getPageBuildStatus({ checked } = {}) {
  const { edited, unbuilt, failed } = reviewPageBuilds();
  const status = {};
  if (checked) {
    status.checked = checked;
  }
  if (failed.length > 0) {
    status.failed = failed;
  }
  if (edited.length > 0) {
    status.changedSinceBuild = edited;
    status.changedSinceBuildNote = checked
      ? 'These pages changed on disk after their last build, but the dev server has not rebuilt them: it has not seen the change yet. Call again; if they stay here, the file watcher missed the edit.'
      : 'These pages changed on disk after their last build and have not been rebuilt, so their errors are not known yet. Call with wait: true to build them.';
  }
  status.unbuilt = unbuilt.length;
  if (unbuilt.length > 0) {
    status.unbuiltNote = `${unbuilt.length} page(s) have not been built since the dev server started, so this status does not cover them. lowdefy_check validates every page.`;
  }
  return status;
}

export default getPageBuildStatus;
