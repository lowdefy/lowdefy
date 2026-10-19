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
import { LowdefyInternalError } from '@lowdefy/errors';
import { type, serializer } from '@lowdefy/helpers';

async function writeWebsocket({ websocket, context }) {
  await context.writeBuildArtifact(
    `websockets/${websocket.websocketId}.json`,
    serializer.serializeToString(websocket ?? {})
  );
}

async function writeWebsockets({ components, context }) {
  if (type.isNone(components.websockets)) return;
  if (!type.isArray(components.websockets)) {
    throw new LowdefyInternalError('Websockets is not an array.');
  }
  const writePromises = components.websockets.map((websocket) =>
    writeWebsocket({ websocket, context })
  );
  return Promise.all(writePromises);
}

export default writeWebsockets;
