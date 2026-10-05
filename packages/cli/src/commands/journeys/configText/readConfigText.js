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
import { normaliseClickText } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import describeBuildErrors from '../configBuilder/describeBuildErrors.js';
import hashConfigTree from './hashConfigTree.js';
import resolveConfigBuilder from '../configBuilder/resolveConfigBuilder.js';
import spawnConfigTreeBuild from '../configBuilder/spawnConfigTreeBuild.js';

const CONFIG_TEXT_FILE = 'configText.json';

function pruneOtherSets({ cacheDirectory, keep }) {
  fs.readdirSync(cacheDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== keep)
    .forEach((entry) => {
      fs.rmSync(path.join(cacheDirectory, entry.name), { recursive: true, force: true });
    });
}

async function buildConfigText({ context, script, cacheDirectory, hash }) {
  const outDirectory = path.join(cacheDirectory, hash);
  fs.rmSync(outDirectory, { recursive: true, force: true });
  fs.mkdirSync(outDirectory, { recursive: true });
  context.logger.info('Building the app config to read its config text.');
  const result = await spawnConfigTreeBuild({
    context,
    script,
    configDirectory: context.directories.config,
    outDirectory,
  });
  if (result.status !== 'ok') {
    fs.rmSync(outDirectory, { recursive: true, force: true });
    const error = new Error(
      `The app config does not build, so its config text cannot be read:\n${describeBuildErrors(
        result.errors
      )}`
    );
    error.errors = result.errors;
    throw error;
  }
  if (!fs.existsSync(path.join(outDirectory, CONFIG_TEXT_FILE))) {
    fs.rmSync(outDirectory, { recursive: true, force: true });
    throw new Error(
      `The dev server installed in ${context.directories.dev} is older than this CLI and writes no config text. Stop the running dev server and start it again to update it.`
    );
  }
  // Only the text set is kept: the build and its scratch server are large
  // and nothing else reads them.
  fs.rmSync(path.join(outDirectory, 'build'), { recursive: true, force: true });
  fs.rmSync(path.join(outDirectory, 'server'), { recursive: true, force: true });
  pruneOtherSets({ cacheDirectory, keep: hash });
}

// The app's config text set: every string its built config can show (page
// strings, menus, i18n messages, plugin default messages, antd's locale
// strings), from one full build of the working tree by the installed dev
// server's builder. Cached under .lowdefy/journeys/config-text/<hash>/, keyed
// on the config files and the builder version, so a read with no config
// change spawns no build.
//
// Returns { texts, isConfigText }: texts is a Set of normalised strings, and
// isConfigText(text) normalises text as the pull does and tests membership.
async function readConfigText({ context }) {
  const { script, version } = resolveConfigBuilder({ context });
  const hash = hashConfigTree({
    configDirectory: context.directories.config,
    builderVersion: version,
  });
  const cacheDirectory = path.join(
    context.directories.config,
    '.lowdefy',
    'journeys',
    'config-text'
  );
  const textPath = path.join(cacheDirectory, hash, CONFIG_TEXT_FILE);
  if (!fs.existsSync(textPath)) {
    await buildConfigText({ context, script, cacheDirectory, hash });
  }
  const texts = new Set(JSON.parse(fs.readFileSync(textPath, 'utf8')));

  function isConfigText(text) {
    const normalised = normaliseClickText(text);
    return !type.isNone(normalised) && texts.has(normalised);
  }

  return { texts, isConfigText };
}

export default readConfigText;
