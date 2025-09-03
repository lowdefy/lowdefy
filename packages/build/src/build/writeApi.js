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
import { type, serializer } from '@lowdefy/helpers';

async function writeEndpoint({ endpoint, context }) {
  await context.writeBuildArtifact(
    `api/${endpoint.endpointId}.json`,
    serializer.serializeToString(endpoint ?? {})
  );
}

async function writeApi({ components, context }) {
  if (type.isNone(components.api)) return;
  if (!type.isArray(components.api)) {
    throw new Error(`Api is not an array.`);
  }
  const writePromises = components.api.map((endpoint) => writeEndpoint({ endpoint, context }));
  return Promise.all(writePromises);
}

export default writeApi;
