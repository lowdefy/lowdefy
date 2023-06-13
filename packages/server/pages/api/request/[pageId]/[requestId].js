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

import path from 'path';
import { callRequest, createApiContext } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import config from '../../../../build/config.json';
import connections from '../../../../build/plugins/connections.js';
import getServerSession from '../../../../lib/auth/getServerSession.js';
import operators from '../../../../build/plugins/operators/server.js';
import fileCache from '../../../../lib/fileCache.js';

export default async function handler(req, res) {
  // try {
  //   if (req.method !== 'POST') {
  //     throw new Error('Only POST requests are supported.');
  //   }
  //   const session = await getServerSession({ req, res });
  //   // Important to give absolute path so Next can trace build files
  //   const apiContext = createApiContext({
  //     buildDirectory: path.join(process.cwd(), 'build'),
  //     config,
  //     connections,
  //     fileCache,
  //     // logger: console,
  //     logger: { debug: () => {}, warn: () => {} },
  //     operators,
  //     secrets: getSecretsFromEnv(),
  //     session,
  //   });

  //   const { blockId, pageId, requestId } = req.query;
  //   const { payload } = req.body;
  //   const response = await callRequest(apiContext, { blockId, pageId, payload, requestId });
  //   res.status(200).json(response);
  // } catch (error) {
  //   res.status(500).json({ name: error.name, message: error.message });
  // }
  res.status(200).json({});
}
