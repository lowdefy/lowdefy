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
import getGraphQL from './getGraphQL';
import prepare from './prepare';

async function initialBuild({ context }) {
  const build = await getBuild({ context });
  await build();
  return build;
}

async function serverSetup({ context, options }) {
  const gqlServer = await getGraphQL({ context });
  return getExpress({ context, gqlServer, options });
}

async function dev(options) {
  const context = await prepare(options);
  const initialBuildPromise = initialBuild({ context });
  const serverSetupPromise = serverSetup({ context, options });

  const [build, { expressApp, reloadFn }] = await Promise.all([
    initialBuildPromise,
    serverSetupPromise,
  ]);

  buildWatcher({ build, context, reloadFn });
  envWatcher({ context });

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
