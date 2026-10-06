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

import readBuildArtifact from './readBuildArtifact.js';

// A page's path pattern, from the route table the skeleton build writes. A page
// the table does not hold has none, so its URL is its id, which the server
// answers as it answers any unknown page.
function readPagePath({ pageId }) {
  const routes = readBuildArtifact({ name: 'routes.json', deserialize: true });
  return routes.find((route) => route.pageId === pageId)?.path;
}

export default readPagePath;
