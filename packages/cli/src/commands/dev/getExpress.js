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
import { get } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';
import findOpenPort from '../../utils/findOpenPort';

async function getExpress({ context, gqlServer }) {
  const serveIndex = async (req, res) => {
    let indexHtml = await readFile(path.resolve(__dirname, 'shell/index.html'));
    let appConfig = await readFile(path.resolve(context.outputDirectory, 'app.json'));
    appConfig = JSON.parse(appConfig);
    indexHtml = indexHtml.replace(
      '<!-- __LOWDEFY_APP_HEAD_HTML__ -->',
      get(appConfig, 'html.appendHead', { default: '' })
    );
    indexHtml = indexHtml.replace(
      '<!-- __LOWDEFY_APP_BODY_HTML__ -->',
      get(appConfig, 'html.appendBody', { default: '' })
    );
    res.send(indexHtml);
  };

  const app = express();

  // port is initialized to 3000 in prepare function
  app.set('port', parseInt(context.options.port));

  gqlServer.applyMiddleware({ app, path: '/api/graphql' });

  const reloadPort = await findOpenPort();
  const reloadReturned = await reload(app, { route: '/api/dev/reload.js', port: reloadPort });

  // serve index.html with appended html
  // else static server serves without appended html
  app.get('/', serveIndex);

  // serve public files
  app.use('/public', express.static(path.resolve(process.cwd(), 'public')));

  // serve webpack files
  app.use(express.static(path.resolve(__dirname, 'shell')));

  // serve version for renderer module federation
  app.use('/api/dev/version', (req, res) => {
    res.json(context.lowdefyVersion);
  });

  // Redirect all 404 to index.html with status 200
  // This should always be the last route
  app.use(serveIndex);
  return { expressApp: app, reloadFn: reloadReturned.reload };
}

export default getExpress;
