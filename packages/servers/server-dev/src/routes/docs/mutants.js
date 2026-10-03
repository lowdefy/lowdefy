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

import path from 'node:path';

import buildPageIfNeeded from '../../../lib/server/jitPageBuilder.js';
import getBuildId from '../../../lib/docs/getBuildId.js';
import listMutants from '../../../lib/server/mutants/listMutants.js';
import mapPageBuildErrors from '../../../lib/docs/mapPageBuildErrors.js';
import readBuildArtifact from '../../../lib/docs/readBuildArtifact.js';
import validateMutantsBody from '../../../lib/server/mutants/validateMutantsBody.js';

// Lists every config mutant on the artifacts a set of journey runs exercised
// (`lowdefy journeys harden`, step 3). Pages are built first, as the page
// route builds them, so the artifacts read are the current config's. Reads
// are never made through a mutant cookie: this route answers for the
// unmutated build. A page that fails to build is a 422 with its errors.
async function docsMutantsHandler(c) {
  const parsed = validateMutantsBody(await c.req.json().catch(() => null));
  if (parsed.error) {
    return c.json({ error: parsed.error }, 400);
  }
  const { body } = parsed;
  const buildDirectory = path.join(process.cwd(), 'build');
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
  const pageIds = [...new Set([...body.pages, ...body.requests.map((request) => request.pageId)])];
  for (const pageId of pageIds) {
    try {
      await buildPageIfNeeded({ pageId, buildDirectory, configDirectory });
    } catch (error) {
      return c.json(
        {
          error: `Page "${pageId}" fails to build, so its mutants cannot be listed until the errors are fixed.`,
          buildErrors: mapPageBuildErrors(error),
        },
        422
      );
    }
  }
  const result = await listMutants({
    ...body,
    readConfigFile: async (name) => readBuildArtifact({ name, deserialize: true }),
    keyMap: readBuildArtifact({ name: 'keyMap.json' }) ?? {},
    refMap: readBuildArtifact({ name: 'refMap.json' }) ?? {},
  });
  return c.json({ buildId: getBuildId(), ...result });
}

export default docsMutantsHandler;
