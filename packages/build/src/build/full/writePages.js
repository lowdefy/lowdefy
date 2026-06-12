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

import collectPageTypes from './collectPageTypes.js';

// D14: emit the type imports ONE page needs as an ES module — block
// components, client actions/operators, icons. Identifiers are generated
// (never derived from user input); all names emit through JSON.stringify
// where they are data.
function pageTypesModule({ page, components, context }) {
  const pageTypes = collectPageTypes({ page, components, context });
  const lines = [];
  const classes = [];
  let n = 0;
  for (const [typeClass, importPath] of [
    ['actions', 'actions'],
    ['blocks', 'blocks'],
    ['operators', 'operators/client'],
  ]) {
    const entries = [];
    for (const imp of pageTypes[typeClass]) {
      const ident = `_t${(n += 1)}`;
      lines.push(
        `import { ${imp.originalTypeName} as ${ident} } from ${JSON.stringify(
          `${imp.package}/${importPath}`
        )};`
      );
      entries.push(`    ${JSON.stringify(imp.typeName)}: ${ident},`);
    }
    classes.push(`  ${typeClass}: {\n${entries.join('\n')}\n  },`);
  }
  const iconEntries = [];
  for (const pkg of pageTypes.icons) {
    for (const icon of pkg.icons) {
      const ident = `_t${(n += 1)}`;
      lines.push(`import { ${icon} as ${ident} } from ${JSON.stringify(pkg.package)};`);
      iconEntries.push(`    ${JSON.stringify(icon)}: ${ident},`);
    }
  }
  classes.push(`  icons: {\n${iconEntries.join('\n')}\n  },`);
  return `${lines.join('\n')}\nexport default {\n${classes.join('\n')}\n};\n`;
}

async function writePage({ page, components, context }) {
  const data = serializer.serializeToString(page ?? {});
  await context.writeBuildArtifact(`pages/${page.pageId}.json`, data);
  // S3b (data-first): PUBLIC pages also emit as ES modules producing exactly
  // the wire shape the client receives from /api/page — auth stripped,
  // serializer-coded form, a fresh tree per call (the engine mutates page
  // config). Protected pages stay fetch-only: page chunks are public static
  // assets, so the registry must never reference them. The page's types
  // (D14) emit as a SEPARATE module so config data stays import-free.
  if (page.auth?.public === true) {
    await context.writeBuildArtifact(
      `pages/${page.pageId}.mjs`,
      `const raw = ${JSON.stringify(data)};\n` +
        `export default () => {\n` +
        `  const { auth, ...config } = JSON.parse(raw);\n` +
        `  return config;\n` +
        `};\n`
    );
    await context.writeBuildArtifact(
      `pages/${page.pageId}.types.mjs`,
      pageTypesModule({ page, components, context })
    );
  }
}

async function writePages({ components, context }) {
  const writePromises = components.pages.map((page) => writePage({ page, components, context }));
  await Promise.all(writePromises);
  // D9: the generated page registry — static import-literal thunks so the
  // client bundler code-splits one public-page chunk each (config data and
  // type imports as sibling chunks). SPA navigation prefers these; registry
  // misses (protected or unknown pages) fall back to the authorized
  // /api/page fetch with the lazy all-types fallback.
  const entries = components.pages
    .filter((page) => page.auth?.public === true)
    .map(
      (page) =>
        `  ${JSON.stringify(page.pageId)}: () =>\n` +
        `    Promise.all([\n` +
        `      import(${JSON.stringify(`./pages/${page.pageId}.mjs`)}),\n` +
        `      import(${JSON.stringify(`./pages/${page.pageId}.types.mjs`)}),\n` +
        `    ]).then(([config, types]) => ({ default: config.default, types: types.default })),`
    );
  await context.writeBuildArtifact(
    'pageRegistry.mjs',
    `export default {\n${entries.join('\n')}\n};\n`
  );
}

export default writePages;
