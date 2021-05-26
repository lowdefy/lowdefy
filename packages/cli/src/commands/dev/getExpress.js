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

import path from 'path';
import express from 'express';
import reload from 'reload';
import findOpenPort from '../../utils/findOpenPort';

async function getExpress({ context, gqlServer, options }) {
  const app = express();
  app.set('port', parseInt(options.port));
  gqlServer.applyMiddleware({ app, path: '/api/graphql' });

  const reloadPort = await findOpenPort();
  const reloadReturned = await reload(app, { route: '/api/dev/reload.js', port: reloadPort });

  app.use('/public', express.static(path.resolve(process.cwd(), 'public')));
  app.use(express.static(path.resolve(__dirname, 'shell')));

  app.use('/api/dev/version', (req, res) => {
    res.json(context.lowdefyVersion);
  });
  app.use(async (req, res) => {
    let indexHtml = await readFile(path.resolve(__dirname, 'shell/index.html'));
    let appConfig = await readFile(path.resolve(context.outputDirectory, 'app.json'));
    appConfig = JSON.parse(appConfig);
    indexHtml = indexHtml.replace('<!-- __LOWDEFY_APP_HEAD_HTML__ -->', appConfig.html.appendHead);
    indexHtml = indexHtml.replace('<!-- __LOWDEFY_APP_BODY_HTML__ -->', appConfig.html.appendBody);
    res.send(indexHtml);
  });
  return { expressApp: app, reloadFn: reloadReturned.reload };
}

export default getExpress;
