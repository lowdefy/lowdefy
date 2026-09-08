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

import { ConfigError } from '@lowdefy/errors';

async function getWebsocketConfig({ logger, readConfigFile }, { websocketId }) {
  const websocketConfig = await readConfigFile(`websockets/${websocketId}.json`);
  if (!websocketConfig) {
    const err = new ConfigError(`Websocket "${websocketId}" does not exist.`);
    logger.debug({ params: { websocketId }, err }, err.message);
    throw err;
  }
  return websocketConfig;
}

export default getWebsocketConfig;
