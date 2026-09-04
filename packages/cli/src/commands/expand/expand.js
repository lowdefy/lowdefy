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
import YAML from 'yaml';
import { writeFile } from '@lowdefy/node-utils';

import confirmExpand from './confirmExpand.js';
import readBuiltPage from './readBuiltPage.js';
import toAuthoredPage from './toAuthoredPage.js';

const HEADER = `# Expanded by "lowdefy expand".
#
# This is the page the archetype generated, written out as ordinary config. It
# is yours now: the archetype no longer owns it, and re-running the archetype
# will not update it. Point the page at this file, e.g.
#   pages:
#     - _ref: pages/{pageId}.yaml
`;

// The way out of an archetype. The expansion is already on disk as a build
// artifact, so expanding is a translation back to authorable config rather than
// a second generator that could disagree with the first.
async function expand({ context, params }) {
  const [pageId] = params;
  if (!pageId) {
    throw new Error('lowdefy expand needs a page id: "lowdefy expand <pageId>".');
  }
  const buildDirectory = context.directories.build;
  const { page, requests } = readBuiltPage({ directory: buildDirectory, pageId });
  const authored = toAuthoredPage({ page, requests });

  const outputPath =
    context.options.output ?? path.join(context.directories.config, 'pages', `${pageId}.yaml`);

  if (fs.existsSync(outputPath)) {
    const confirmed = await confirmExpand({
      context,
      options: context.options,
      filePath: outputPath,
    });
    if (!confirmed) {
      process.exitCode = 1;
      await context.sendTelemetry();
      return;
    }
  }

  const yaml = `${HEADER.replace('{pageId}', pageId)}\n${YAML.stringify(authored, {
    lineWidth: 0,
  })}`;
  await writeFile(outputPath, yaml);

  context.logger.succeed(`Expanded page "${pageId}" to ${outputPath}.`);
  context.logger.info(
    `Replace the archetype declaration for "${pageId}" with a _ref to this file, then re-run "lowdefy build".`
  );
  await context.sendTelemetry();
}

export default expand;
