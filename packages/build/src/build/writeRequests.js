/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function writeRequestsOnPage({ page, context }) {
  return Promise.all(
    page.requests.map(async (request) => {
      await context.writeBuildArtifact(
        `pages/${page.pageId}/requests/${request.requestId}.json`,
        serializer.serializeToString(request ?? {})
      );
      delete request.properties;
      delete request.type;
      delete request.connectionId;
      delete request.auth;
    })
  );
}

async function writeRequests({ components, context }) {
  const writePromises = components.pages.map((page) => writeRequestsOnPage({ page, context }));
  return Promise.all(writePromises);
}

export default writeRequests;
