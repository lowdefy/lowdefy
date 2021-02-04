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

import opener from 'opener';

import buildWatcher from './buildWatcher';
import envWatcher from './envWatcher';
import getBuild from './getBuild';
import getExpress from './getExpress';
import getGraphQl from './getGraphQl';
import prepare from './prepare';

async function dev(options) {
  const context = await prepare(options);
  const build = await getBuild({ context });
  const gqlServer = await getGraphQl({ context });
  const { expressApp, reloadFn } = await getExpress({ context, gqlServer, options });

  buildWatcher({ build, context, reloadFn });
  envWatcher({ context });

  // Start server
  context.print.log('Starting Lowdefy development server.');
  expressApp.listen(expressApp.get('port'), function () {
    context.print.info(`Development server listening on port ${options.port}`);
  });
  opener(`http://localhost:${options.port}`);

  await context.sendTelemetry({
    data: {
      command: 'dev',
      type: 'startup',
    },
  });
}

export default dev;
