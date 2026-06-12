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
import { serializer } from '@lowdefy/helpers';

async function writePage({ page, context }) {
  const data = serializer.serializeToString(page ?? {});
  await context.writeBuildArtifact(`pages/${page.pageId}.json`, data);
  // S3b (data-first): compiled builds also emit the page as an ES module —
  // the same serialized data, deserialized fresh per call (the engine
  // mutates page config, so no shared trees across navigations). Operator
  // positions stay verbatim data; closures land in S3c.
  if (context.compiler === true) {
    await context.writeBuildArtifact(
      `pages/${page.pageId}.mjs`,
      `import { serializer } from '@lowdefy/helpers';\n` +
        `const raw = ${JSON.stringify(data)};\n` +
        `export default () => serializer.deserializeFromString(raw);\n`
    );
  }
}

async function writePages({ components, context }) {
  const writePromises = components.pages.map((page) => writePage({ page, context }));
  await Promise.all(writePromises);
  // D9: the generated page registry — static import-literal thunks so the
  // client bundler code-splits one chunk per page.
  if (context.compiler === true) {
    const entries = components.pages.map(
      (page) =>
        `  ${JSON.stringify(page.pageId)}: () => import(${JSON.stringify(
          `./pages/${page.pageId}.mjs`
        )}),`
    );
    await context.writeBuildArtifact(
      'pageRegistry.mjs',
      `export default {\n${entries.join('\n')}\n};\n`
    );
  }
}

export default writePages;
