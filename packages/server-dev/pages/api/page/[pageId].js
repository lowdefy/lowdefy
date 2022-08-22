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

import { createApiContext, getPageConfig } from '@lowdefy/api';
import getServerSession from '../../../lib/auth/getServerSession.js';

export default async function handler(req, res) {
  const session = await getServerSession({ req, res });
  const apiContext = await createApiContext({
    buildDirectory: './build',
    logger: console,
    session,
  });

  const { pageId } = req.query;
  const pageConfig = await getPageConfig(apiContext, { pageId });
  if (pageConfig === null) {
    res.status(404).send('Page not found.');
  } else {
    res.status(200).json(pageConfig);
  }
}
