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
import { spawnSync } from 'child_process';
import fse from 'fs-extra';
import { readFile, writeFile } from '@lowdefy/node-utils';

import checkChildProcessError from '../../utils/checkChildProcessError';
import startUp from '../../utils/startUp';
import getFederatedModule from '../../utils/getFederatedModule';
import fetchNpmTarball from '../../utils/fetchNpmTarball';

async function fetchNetlifyServer({ context, netlifyDir }) {
  context.print.log('Fetching Lowdefy Netlify server.');
  await fetchNpmTarball({
    packageName: '@lowdefy/server-netlify',
    version: context.lowdefyVersion,
    directory: netlifyDir,
  });
  context.print.log('Fetched Lowdefy Netlify server.');
}

async function npmInstall({ context, netlifyDir }) {
  await fse.copy(path.resolve(netlifyDir, 'package/package.json'), path.resolve('./package.json'));
  await fse.remove(path.resolve('./package-lock.json'));
  await fse.remove(path.resolve('./package-lock.json'));
  await fse.emptyDir(path.resolve('./node_modules'));

  context.print.log('npm install production.');
  let processOutput = spawnSync('npm', ['install', '--production', '--legacy-peer-deps']);
  checkChildProcessError({
    context,
    processOutput: processOutput,
    message: 'Failed to npm install Netlify server.',
  });
  context.print.log('npm install successful.');
  context.print.log(processOutput.stdout.toString('utf8'));
}

async function fetchBuildScript({ context }) {
  context.print.log('Fetching Lowdefy build script.');
  const { default: buildScript } = await getFederatedModule({
    module: 'build',
    packageName: '@lowdefy/build',
    version: context.lowdefyVersion,
    context,
  });
  context.print.log('Fetched Lowdefy build script.');
  return buildScript;
}

async function build({ context, buildScript, netlifyDir }) {
  context.print.log('Starting Lowdefy build.');
  const outputDirectory = path.resolve(netlifyDir, './package/dist/functions/graphql/build');
  await buildScript({
    logger: context.print,
    cacheDirectory: context.cacheDirectory,
    configDirectory: context.baseDirectory,
    outputDirectory,
  });
  context.print.log(`Build artifacts saved at ${outputDirectory}.`);
}

async function buildIndexHtml({ context }) {
  context.print.log('Starting Lowdefy index.html build.');
  let appConfig = await readFile(path.resolve('./.lowdefy/functions/graphql/build/app.json'));
  appConfig = JSON.parse(appConfig);
  const indexHtmlPath = path.resolve('./.lowdefy/publish/index.html');
  let indexHtml = await readFile(indexHtmlPath);
  indexHtml = indexHtml.replace('<!-- __LOWDEFY_APP_HEAD_HTML__ -->', appConfig.html.appendHeader);
  indexHtml = indexHtml.replace('<!-- __LOWDEFY_APP_BODY_HTML__ -->', appConfig.html.appendBody);
  await writeFile({
    filePath: indexHtmlPath,
    content: indexHtml,
  });
  context.print.log('Lowdefy index.html build complete.');
}

async function moveBuildArtifacts({ context, netlifyDir }) {
  await fse.copy(
    path.resolve(netlifyDir, 'package/dist/shell'),
    path.resolve('./.lowdefy/publish')
  );
  context.print.log(`Netlify publish artifacts moved to "./lowdefy/publish".`);
}

async function moveFunctions({ context, netlifyDir }) {
  await fse.copy(
    path.resolve(netlifyDir, 'package/dist/functions'),
    path.resolve('./.lowdefy/functions')
  );
  context.print.log(`Netlify functions artifacts moved to "./lowdefy/functions".`);
}

async function movePublicAssets({ context }) {
  context.print.log(`Moving public assets.`);
  await fse.ensureDir(path.resolve('./public'));
  await fse.copy(path.resolve('./public'), path.resolve('./.lowdefy/publish/public'));
  context.print.log(`Public assets moved to "./lowdefy/publish/public".`);
}

async function buildNetlify({ context, options }) {
  if (process.env.NETLIFY === 'true') {
    options.basicPrint = true;
  }
  await startUp({ context, options, command: 'build-netlify' });
  const netlifyDir = path.resolve(context.baseDirectory, './.lowdefy/netlify');

  context.print.info('Starting build.');
  const buildScript = await fetchBuildScript({ context });
  await build({ context, buildScript, netlifyDir });

  context.print.info('Installing Lowdefy server.');
  await fetchNetlifyServer({ context, netlifyDir });
  await npmInstall({ context, netlifyDir });

  context.print.log(`Moving artifacts.`);
  await moveBuildArtifacts({ context, netlifyDir });
  await moveFunctions({ context, netlifyDir });
  await movePublicAssets({ context });

  context.print.log(`Build artifacts.`);
  await buildIndexHtml({ context });

  await context.sendTelemetry({
    data: {
      netlify: process.env.NETLIFY === 'true',
    },
  });
  context.print.succeed(`Netlify build completed successfully.`);
}

export default buildNetlify;
