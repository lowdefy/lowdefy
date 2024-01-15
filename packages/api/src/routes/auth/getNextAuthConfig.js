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

import { ServerParser } from '@lowdefy/operators';
import { _secret } from '@lowdefy/operators-js/operators/server';

import createAdapter from './createAdapter.js';
import createCallbacks from './callbacks/createCallbacks.js';
import createEvents from './events/createEvents.js';
import createLogger from './createLogger.js';
import createProviders from './createProviders.js';

const nextAuthConfig = {};
let initialized = false;

function getNextAuthConfig({ authJson, logger, plugins, secrets }) {
  if (initialized) return nextAuthConfig;

  const operatorsParser = new ServerParser({
    operators: { _secret },
    payload: {},
    secrets,
    user: {},
  });

  const { output: authConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
  });

  if (operatorErrors.length > 0) {
    throw new Error(operatorErrors[0]);
  }

  nextAuthConfig.adapter = createAdapter({ authConfig, logger, plugins });
  nextAuthConfig.callbacks = createCallbacks({ authConfig, logger, plugins });
  nextAuthConfig.events = createEvents({ authConfig, logger, plugins });
  nextAuthConfig.logger = createLogger({ logger });
  nextAuthConfig.providers = createProviders({ authConfig, logger, plugins });
  nextAuthConfig.debug = authConfig.debug ?? logger?.isLevelEnabled('debug') === true;
  nextAuthConfig.pages = authConfig.authPages;
  nextAuthConfig.session = authConfig.session;
  nextAuthConfig.theme = authConfig.theme;
  nextAuthConfig.cookies = authConfig?.advanced?.cookies;
  nextAuthConfig.originalRedirectCallback = nextAuthConfig.callbacks.redirect;
  initialized = true;
  return nextAuthConfig;
}

export default getNextAuthConfig;
