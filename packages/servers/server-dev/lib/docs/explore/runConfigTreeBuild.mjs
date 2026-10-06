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

import fs from 'node:fs';
import path from 'node:path';
import build from '@lowdefy/build';
import defaultMessagesMap from '@lowdefy/build/defaultMessagesMap';
import { serializeBuildException } from '@lowdefy/build/dev';
import { mergeObjects } from '@lowdefy/helpers';

import collectConfigText from './collectConfigText.mjs';
import createCustomPluginMessagesMap from '../../../manager/utils/createCustomPluginMessagesMap.mjs';
import createCustomPluginTypesMap from '../../../manager/utils/createCustomPluginTypesMap.mjs';
import prepareScratchServer from './prepareScratchServer.mjs';

// A full config build of one tree for the explorer's scope diff: the pipeline
// `lowdefy build` runs, without the Vite client build, at stage dev so a
// prodError warning stays a warning as it does in the dev server. The plugin
// types come from the installed dev server, so base and head are built by
// one builder and a Lowdefy version bump does not show as a config change.
// Writes <out>/build/, <out>/server/ and <out>/result.json, which the CLI
// reads for the build's errors and warnings. A build that succeeds also
// writes <out>/configText.json, the app's config text set, which the journey
// readers resolve production text tokens against.
async function runConfigTreeBuild({
  configDirectory,
  outDirectory,
  devDirectory,
  logger,
  refResolver,
}) {
  const directories = {
    config: configDirectory,
    build: path.join(outDirectory, 'build'),
    server: path.join(outDirectory, 'server'),
  };
  const resultPath = path.join(outDirectory, 'result.json');
  const configTextPath = path.join(outDirectory, 'configText.json');
  await fs.promises.rm(resultPath, { force: true });
  await fs.promises.rm(configTextPath, { force: true });
  await prepareScratchServer({ devDirectory, serverDirectory: directories.server });
  let result;
  try {
    const [customTypesMap, customMessagesMap] = await Promise.all([
      createCustomPluginTypesMap({ directories, logger }),
      createCustomPluginMessagesMap({ directories, logger }),
    ]);
    await build({
      customMessagesMap,
      customTypesMap,
      directories,
      logger,
      refResolver,
      stage: 'dev',
    });
    const configText = await collectConfigText({
      buildDirectory: directories.build,
      messagesMap: mergeObjects([defaultMessagesMap, customMessagesMap]),
    });
    await fs.promises.writeFile(configTextPath, JSON.stringify(configText, null, 2));
    result = { status: 'ok', errors: [], warnings: [] };
  } catch (error) {
    result = {
      status: 'error',
      errors: error.errors ?? [serializeBuildException(error)],
      warnings: error.warnings ?? [],
    };
  }
  await fs.promises.writeFile(resultPath, JSON.stringify(result, null, 2));
  return result;
}

export default runConfigTreeBuild;
