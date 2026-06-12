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
import { type, serializer } from '@lowdefy/helpers';
import { emitEndpointModule } from '@lowdefy/compile';

import serverOperatorSet from './full/serverOperatorSet.js';

async function writeEndpoint({ endpoint, context }) {
  await context.writeBuildArtifact(
    `api/${endpoint.endpointId}.json`,
    serializer.serializeToString(endpoint ?? {})
  );
  // S3a (endpoints): compiled builds additionally ship the whole endpoint as
  // a module — routine control inputs and step properties that contain
  // server operators become closures; the routine runner's per-step
  // evaluation dispatches on them. JIT (dev) builds skip — S4.
  if (context.compiler === true) {
    const { code } = emitEndpointModule({
      endpoint: endpoint ?? {},
      operators: serverOperatorSet(context),
    });
    await context.writeBuildArtifact(`api/${endpoint.endpointId}.mjs`, code);
  }
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
