/*
  Copyright 2020-2022 Lowdefy, Inc

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

import NextAuth from 'next-auth';
import { getNextAuthConfig } from '@lowdefy/api';

import authJson from '../../../build/auth.json';
import adapters from '../../../build/plugins/auth/adapters.js';
import callbacks from '../../../build/plugins/auth/callbacks.js';
import events from '../../../build/plugins/auth/events.js';
import providers from '../../../build/plugins/auth/providers.js';

// TODO: make createApiContext synchronous
export default async function auth(req, res) {
  if (authJson.configured === true) {
    return await NextAuth(
      req,
      res,
      getNextAuthConfig(
        { logger: console },
        { authJson, plugins: { adapters, callbacks, events, providers } }
      )
    );
  }

  return res.status(404).json({
    message: 'Auth not configured',
  });
}
