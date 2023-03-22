/*
  Copyright 2020-2023 Lowdefy, Inc

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
import { getSecretsFromEnv } from '@lowdefy/node-utils';
import { _secret } from '@lowdefy/operators-js/operators/server';

import createAdapter from './createAdapter.js';
import createCallbacks from './callbacks/createCallbacks.js';
import createEvents from './events/createEvents.js';
import createProviders from './createProviders.js';

const nextAuthConfig = {};
let initialized = false;

function getNextAuthConfig(context, { authJson, plugins }) {
  if (initialized) return nextAuthConfig;
  const secrets = getSecretsFromEnv();

  // TODO: Add logger
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

  nextAuthConfig.adapter = createAdapter(context, { authConfig, plugins });
  nextAuthConfig.callbacks = createCallbacks(context, { authConfig, plugins });
  nextAuthConfig.events = createEvents(context, { authConfig, plugins });
  nextAuthConfig.providers = createProviders(context, { authConfig, plugins });

  nextAuthConfig.session = authConfig.session;
  nextAuthConfig.theme = authConfig.theme;
  nextAuthConfig.pages = authConfig.authPages;
  nextAuthConfig.cookies = authConfig?.advanced?.cookies;
  initialized = true;
  return nextAuthConfig;
}

export default getNextAuthConfig;
