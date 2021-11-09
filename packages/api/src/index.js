/*
  Copyright 2020-2021 Lowdefy, Inc

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

import createContext from './context/createContext.js';
import getHomePageId from './routes/rootConfig/getHomePageId.js';
import getPageConfig from './routes/page/getPageConfig.js';
import openIdAuthorizationUrl from './routes/auth/openIdAuthorizationUrl.js';
import openIdCallback from './routes/auth/openIdCallback.js';
import openIdLogoutUrl from './routes/auth/openIdLogoutUrl.js';
import request from './routes/request/request.js';
import rootConfig from './routes/rootConfig/rootConfig.js';

import {
  AuthenticationError,
  ConfigurationError,
  RequestError,
  ServerError,
  TokenExpiredError,
} from './context/errors.js';

export {
  AuthenticationError,
  ConfigurationError,
  createContext,
  getHomePageId,
  getPageConfig,
  openIdAuthorizationUrl,
  openIdCallback,
  openIdLogoutUrl,
  request,
  RequestError,
  rootConfig,
  ServerError,
  TokenExpiredError,
};
