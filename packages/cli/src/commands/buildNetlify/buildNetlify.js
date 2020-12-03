/*
  Copyright 2020 Lowdefy, Inc

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
import { spawnSync } from 'child_process';

import checkChildProcessError from '../../utils/checkChildProcessError';
import createContext from '../../utils/context';
import getBuildScript from '../../utils/getBuildScript';
import fetchNpmTarball from '../../utils/fetchNpmTarball';

async function buildNetlify(options) {
  if (process.env.NETLIFY === 'true') {
    options.printTimestamp = false;
    options.printColor = false;
  }

  const context = await createContext(options);
  const netlifyDir = path.resolve(context.baseDirectory, './.lowdefy/netlify');

  context.print.info('Fetching lowdefy netlify server.');
  await fetchNpmTarball({
    name: '@lowdefy/server-netlify',
    version: context.version,
    directory: netlifyDir,
  });

  context.print.info('npm install production.');
  let proccessOutput = spawnSync('npm', ['install', '--production', '--legacy-peer-deps'], {
    cwd: path.resolve(netlifyDir, 'package'),
  });

  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to npm install netlify server.',
  });

  context.print.info(proccessOutput.stdout.toString('utf8'));

  context.print.info('Fetching lowdefy build script.');
  await getBuildScript(context);

  context.print.info('Starting lowdefy build.');
  const outputDirectory = path.resolve(netlifyDir, './package/dist/functions/graphql/build');
  await context.buildScript({
    logger: context.print,
    cacheDirectory: context.cacheDirectory,
    configDirectory: context.baseDirectory,
    outputDirectory,
  });
  context.print.info(`Build artifacts saved at ${outputDirectory}.`);

  context.print.info(`Moving output artifacts.`);
  proccessOutput = spawnSync('cp', [
    '-r',
    path.resolve(netlifyDir, 'package/dist/functions'),
    path.resolve('./.lowdefy/functions'),
  ]);
  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to move functions artifacts.',
  });

  proccessOutput = spawnSync('cp', [
    '-r',
    path.resolve(netlifyDir, 'package/dist/shell'),
    path.resolve('./.lowdefy/publish'),
  ]);
  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to move publish artifacts.',
  });

  proccessOutput = spawnSync('cp', [
    '-r',
    path.resolve(netlifyDir, 'package/node_modules'),
    path.resolve('./node_modules'),
  ]);
  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to move node_modules.',
  });

  context.print.info(`Netlify build completed successfully.`);
}

export default buildNetlify;
