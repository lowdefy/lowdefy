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

import fs from 'fs';
import path from 'path';
import { cleanDirectory, readFile } from '@lowdefy/node-utils';
import fetchNpmTarball from '../../utils/fetchNpmTarball.js';

async function getServer({ context }) {
  let fetchServer = false;

  const serverExists = fs.existsSync(path.join(context.directories.server, 'package.json'));
  if (!serverExists) fetchServer = true;

  if (serverExists) {
    const serverPackageConfig = JSON.parse(
      await readFile(path.join(context.directories.server, 'package.json'))
    );
    if (serverPackageConfig.version !== context.lowdefyVersion) {
      fetchServer = true;
      context.print.warn(`Removing @lowdefy/server with version ${serverPackageConfig.version}`);
      await cleanDirectory(context.directories.server);
    }
  }

  if (fetchServer) {
    context.print.spin('Fetching @lowdefy/server from npm.');
    await fetchNpmTarball({
      packageName: '@lowdefy/server',
      version: context.lowdefyVersion,
      directory: context.directories.server,
    });
    context.print.log('Fetched @lowdefy/server from npm.');
    return;
  }
}

export default getServer;
