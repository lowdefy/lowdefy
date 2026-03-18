/*
  Copyright 2020-2026 Lowdefy, Inc

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
import axios from 'axios';
import { cleanDirectory, readFile } from '@lowdefy/node-utils';
import fetchNpmTarball from '../../utils/fetchNpmTarball.js';

async function getCodemods({ directory, logger }) {
  const packageJsonPath = path.join(directory, 'package.json');

  // Query npm for the latest version
  let latestVersion;
  try {
    const packageInfo = await axios.get('https://registry.npmjs.org/@lowdefy/codemods');
    latestVersion = packageInfo.data['dist-tags']?.latest;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(
        'No @lowdefy/codemods package found on npm. Upgrade manually using the migration guide.'
      );
    }
    throw error;
  }

  if (!latestVersion) {
    throw new Error('Could not determine latest @lowdefy/codemods version.');
  }

  // Check if cached version matches
  let fetchCodemods = false;
  const exists = fs.existsSync(packageJsonPath);

  if (!exists) {
    fetchCodemods = true;
  } else {
    const cachedConfig = JSON.parse(await readFile(packageJsonPath));
    if (cachedConfig.version !== latestVersion) {
      logger.info(`Updating codemods package from ${cachedConfig.version} to ${latestVersion}.`);
      await cleanDirectory(directory);
      fetchCodemods = true;
    }
  }

  if (fetchCodemods) {
    logger.info({ spin: 'start' }, 'Fetching @lowdefy/codemods from npm.');
    await fetchNpmTarball({
      packageName: '@lowdefy/codemods',
      version: latestVersion,
      directory,
    });
    logger.info('Fetched @lowdefy/codemods from npm.');
  }

  // Read and return registry
  const registryPath = path.join(directory, 'registry.json');
  if (!fs.existsSync(registryPath)) {
    throw new Error('Codemods package missing registry.json.');
  }

  return {
    registry: JSON.parse(fs.readFileSync(registryPath, 'utf8')),
    directory,
  };
}

export default getCodemods;
