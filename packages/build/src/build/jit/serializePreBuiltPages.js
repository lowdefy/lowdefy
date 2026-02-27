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

import { serializer } from '@lowdefy/helpers';

// Serialize non-shallow page data for writing after cleanBuildDirectory.
// Must run before stripPreBuiltPages, which removes the content being serialized.
function serializePreBuiltPages({ components }) {
  const preBuiltPageArtifacts = [];
  for (const page of components.pages ?? []) {
    if (page['~shallow']) continue;
    preBuiltPageArtifacts.push({
      pageId: page.pageId,
      pageJson: serializer.serializeToString(page),
      requests: (page.requests ?? []).map((request) => ({
        requestId: request.requestId,
        requestJson: serializer.serializeToString(request),
      })),
    });
  }
  return preBuiltPageArtifacts;
}

export default serializePreBuiltPages;
