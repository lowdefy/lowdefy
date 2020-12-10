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
import getFederatedModule from '../../utils/getFederatedModule';
import fetchNpmTarball from '../../utils/fetchNpmTarball';

async function buildNetlify(options) {
  if (process.env.NETLIFY === 'true') {
    options.basicPrint = true;
  }

  const context = await createContext(options);
  const netlifyDir = path.resolve(context.baseDirectory, './.lowdefy/netlify');
  context.print.info('Starting Netlify build.');

  context.print.spin('Fetching Lowdefy Netlify server.');
  await fetchNpmTarball({
    packageName: '@lowdefy/server-netlify',
    version: context.version,
    directory: netlifyDir,
  });
  context.print.log('Fetched Lowdefy Netlify server.');

  context.print.spin('npm install production.');
  let proccessOutput = spawnSync('npm', ['install', '--production', '--legacy-peer-deps'], {
    cwd: path.resolve(netlifyDir, 'package'),
  });
  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to npm install Netlify server.',
  });

  context.print.log('npm install successful.');
  context.print.log(proccessOutput.stdout.toString('utf8'));

  context.print.spin('Fetching Lowdefy build script.');
  const { default: buildScript } = await getFederatedModule({
    module: 'build',
    packageName: '@lowdefy/build',
    version: context.version,
    context,
  });
  context.print.log('Fetched Lowdefy build script.');

  context.print.spin('Starting Lowdefy build.');
  const outputDirectory = path.resolve(netlifyDir, './package/dist/functions/graphql/build');
  await buildScript({
    logger: context.print,
    cacheDirectory: context.cacheDirectory,
    configDirectory: context.baseDirectory,
    outputDirectory,
  });
  context.print.log(`Build artifacts saved at ${outputDirectory}.`);

  context.print.log(`Moving output artifacts.`);
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
  context.print.log(`Netlify publish artifacts moved to "./lowdefy/publish".`);

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
  context.print.log(`Netlify functions artifacts moved to "./lowdefy/functions".`);

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

  context.print.log(`Moving public assets.`);
  // Make dir if it does not exist since cp will error
  proccessOutput = spawnSync('mkdir', ['-p', path.resolve('./public')]);
  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to move public assets.',
  });
  proccessOutput = spawnSync('cp', [
    '-r',
    path.resolve('./public'),
    path.resolve('./.lowdefy/publish/public'),
  ]);
  checkChildProcessError({
    context,
    proccessOutput,
    message: 'Failed to move public assets.',
  });
  context.print.log(`Public assets moved to "./lowdefy/publish/public".`);

  context.print.succeed(`Netlify build completed successfully.`);
}

export default buildNetlify;
