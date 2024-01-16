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

import createJWTCallback from './createJWTCallback.js';
import createRedirectCallback from './createRedirectCallback.js';
import createSessionCallback from './createSessionCallback.js';
import createSignInCallback from './createSignInCallback.js';

function createCallbacks({ authConfig, logger, plugins }) {
  const callbacks = {
    session: createSessionCallback({ authConfig, logger, plugins }),
  };
  const jwt = createJWTCallback({ authConfig, logger, plugins });
  if (jwt) callbacks.jwt = jwt;

  const redirect = createRedirectCallback({ authConfig, logger, plugins });
  if (redirect) callbacks.redirect = redirect;

  const signIn = createSignInCallback({ authConfig, plugins });
  if (signIn) callbacks.signIn = signIn;

  return callbacks;
}

export default createCallbacks;
