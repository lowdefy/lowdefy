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
import versionWatcher from './versionWatcher';

async function initialBuild({ context }) {
  const build = await getBuild({ context });
  await build();
  return build;
}

async function serverSetup({ context }) {
  const gqlServer = await getGraphQL({ context });
  return getExpress({ context, gqlServer });
}

async function dev({ context }) {
  await prepare({ context });
  const initialBuildPromise = initialBuild({ context });
  const serverSetupPromise = serverSetup({ context });

  const [build, { expressApp, reloadFn }] = await Promise.all([
    initialBuildPromise,
    serverSetupPromise,
  ]);

  buildWatcher({ build, context, reloadFn });
  envWatcher({ context });
  versionWatcher({ context });

  context.print.log('Starting Lowdefy development server.');

  const port = expressApp.get('port');
  expressApp.listen(port, function () {
    context.print.info(`Development server listening on port ${port}`);
  });
  opener(`http://localhost:${port}`);

  await context.sendTelemetry({
    data: {
      type: 'startup',
    },
  });
}

export default dev;
