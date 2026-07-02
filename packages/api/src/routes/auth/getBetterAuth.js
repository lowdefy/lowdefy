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

import { betterAuth } from 'better-auth';

import getBetterAuthConfig from './getBetterAuthConfig.js';

let instance;

// The BetterAuth instance is constructed once per process at first use -
// it handles /api/auth/* and resolves sessions for every request.
function getBetterAuth({
  appMeta,
  authJson,
  config,
  createSystemContext,
  dev,
  logger,
  plugins,
  secrets,
}) {
  if (instance) return instance;
  instance = betterAuth(
    getBetterAuthConfig({
      appMeta,
      authJson,
      config,
      createSystemContext,
      dev,
      logger,
      plugins,
      secrets,
    })
  );
  return instance;
}

export default getBetterAuth;
