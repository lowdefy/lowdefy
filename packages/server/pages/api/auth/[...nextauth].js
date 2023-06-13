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

import NextAuth from 'next-auth';
import { createApiContext, getNextAuthConfig } from '@lowdefy/api';

import adapters from '../../../build/plugins/auth/adapters.js';
import authJson from '../../../build/auth.json';
import callbacks from '../../../build/plugins/auth/callbacks.js';
import config from '../../../build/config.json';
import events from '../../../build/plugins/auth/events.js';
import fileCache from '../../../lib/fileCache.js';
import providers from '../../../build/plugins/auth/providers.js';

import createLogger from '../../../lib/log/createLogger.js';

export const authOptions = getNextAuthConfig(
  createApiContext({
    config,
    fileCache,
    logger: createLogger(),
  }),
  { authJson, plugins: { adapters, callbacks, events, providers } }
);

export default async function auth(req, res) {
  if (authJson.configured === true) {
    // Required for emails in corporate networks, see:
    // https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }
    return await NextAuth(req, res, authOptions);
  }

  return res.status(404).json({
    message: 'Auth not configured',
  });
}
