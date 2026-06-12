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
  // S3b (data-first): PUBLIC pages also emit as ES modules producing exactly
  // the wire shape the client receives from /api/page — auth stripped,
  // serializer-coded form, a fresh tree per call (the engine mutates page
  // config). Protected pages stay fetch-only: page chunks are public static
  // assets, so the registry must never reference them.
  if (page.auth?.public === true) {
    await context.writeBuildArtifact(
      `pages/${page.pageId}.mjs`,
      `const raw = ${JSON.stringify(data)};\n` +
        `export default () => {\n` +
        `  const { auth, ...config } = JSON.parse(raw);\n` +
        `  return config;\n` +
        `};\n`
    );
  }
}

async function writePages({ components, context }) {
  const writePromises = components.pages.map((page) => writePage({ page, context }));
  await Promise.all(writePromises);
  // D9: the generated page registry — static import-literal thunks so the
  // client bundler code-splits one public-page chunk each. SPA navigation
  // prefers these; registry misses (protected or unknown pages) fall back
  // to the authorized /api/page fetch.
  const entries = components.pages
    .filter((page) => page.auth?.public === true)
    .map(
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

export default writePages;
