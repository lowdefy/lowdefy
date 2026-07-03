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

import callAgent from './routes/agent/callAgent.js';
import callEndpoint from './routes/endpoints/callEndpoint.js';
import callRequest from './routes/request/callRequest.js';
import createApiContext from './context/createApiContext.js';
import createChannelRegistry from './routes/websocket/createChannelRegistry.js';
import createSystemContext from './context/createSystemContext.js';
import createWebSocketConnection from './routes/websocket/createWebSocketConnection.js';
import getAuthStrategies from './routes/auth/strategies/getAuthStrategies.js';
import getBetterAuth from './routes/auth/getBetterAuth.js';
import getBetterAuthConfig from './routes/auth/getBetterAuthConfig.js';
import getHomeAndMenus from './routes/rootConfig/getHomeAndMenus.js';
import getPageConfig from './routes/page/getPageConfig.js';
import getRootConfig from './routes/rootConfig/getRootConfig.js';
import logClientError from './routes/log/logClientError.js';
import resolveAuthentication from './context/resolveAuthentication.js';
import runScheduledEndpoint from './routes/endpoints/runScheduledEndpoint.js';

export {
  callAgent,
  callEndpoint,
  callRequest,
  createApiContext,
  createChannelRegistry,
  createSystemContext,
  createWebSocketConnection,
  getAuthStrategies,
  getBetterAuth,
  getBetterAuthConfig,
  getHomeAndMenus,
  getPageConfig,
  getRootConfig,
  logClientError,
  resolveAuthentication,
  runScheduledEndpoint,
};
