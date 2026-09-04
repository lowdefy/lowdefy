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

import { compile, nestSchemaPaths } from '@lowdefy/ajv';
import { isStateWritingCategory } from '@lowdefy/block-utils';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import checkValidateActionSchemas from './checkValidateActionSchemas.js';
import collectExceptions from '../../utils/collectExceptions.js';
import findSimilarString from '../../utils/findSimilarString.js';
import collectStateUsage, { resolveStatePath } from './collectStateUsage.js';

const CHECK_SLUG = 'state-schema';

// Every path the contract names, flattened through `properties` so a typo
// suggestion can point at `data.address.formatted_address` and not just at the
// declared key above it.
function listDeclaredPaths({ schema, prefix, paths }) {
  if (!type.isObject(schema) || !type.isObject(schema.properties)) return;
  Object.keys(schema.properties).forEach((key) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    paths.push(path);
    listDeclaredPaths({ schema: schema.properties[key], prefix: path, paths });
  });
}

function declaredEntries({ page }) {
  return Object.entries(page.stateSchema).filter(([key]) => !key.startsWith('~'));
}

function validateFragments({ page, context }) {
  declaredEntries({ page }).forEach(([path, fragment]) => {
    try {
      compile({ schema: fragment });
    } catch (error) {
      collectExceptions(
        context,
        new ConfigError(
          `Page "${page.pageId}" state contract for "${path}" is not a valid JSON schema: ${error.message}.`,
          {
            configKey: fragment['~k'] ?? page.stateSchema['~k'] ?? page['~k'],
            checkSlug: CHECK_SLUG,
          }
        )
      );
    }
  });
}

function validateStateSchema({ page, context }) {
  // Runs whether or not the page declares a contract: a Validate action that
  // targets one is wrong precisely when there is none.
  checkValidateActionSchemas({ page, context });

  if (!type.isObject(page.stateSchema)) return;

  validateFragments({ page, context });

  const { blockIds, setStateKeys, stateRefs } = collectStateUsage({ page });
  const declaredKeys = declaredEntries({ page }).map(([path]) => path);
  const stateSchema = nestSchemaPaths({ paths: Object.fromEntries(declaredEntries({ page })) });
  const candidates = [];
  listDeclaredPaths({ schema: stateSchema, prefix: '', paths: candidates });

  const usages = [];
  blockIds.forEach(({ id, type: blockType, configKey }) => {
    // A block type that is not in blockMetas has no category here; its unknown
    // type is already reported by buildTypes, so it is skipped rather than
    // guessed at.
    const category = context.blockMetas?.[blockType]?.category;
    if (!isStateWritingCategory(category)) return;
    usages.push({ path: id, configKey });
  });
  setStateKeys.forEach(({ key, configKey }) => usages.push({ path: key, configKey }));
  stateRefs.forEach(({ path, configKey }) => usages.push({ path, configKey }));

  const reported = new Set();
  usages.forEach(({ path, configKey }) => {
    if (resolveStatePath({ stateSchema, path }) !== null) return;
    const dedupeKey = `${configKey}:${path}`;
    if (reported.has(dedupeKey)) return;
    reported.add(dedupeKey);

    const suggestion = findSimilarString({ input: path, candidates });
    const didYouMean = suggestion === null ? '' : ` Did you mean "${suggestion}"?`;
    collectExceptions(
      context,
      new ConfigError(
        `Page "${page.pageId}" declares a state contract and "${path}" is not part of it. ` +
          `Declared paths: ${declaredKeys.join(', ')}.${didYouMean}`,
        { configKey, checkSlug: CHECK_SLUG }
      )
    );
  });
}

export default validateStateSchema;
