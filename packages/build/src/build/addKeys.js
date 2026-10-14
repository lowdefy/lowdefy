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

import { type } from '@lowdefy/helpers';
import { ConfigError, PLUGIN_CHECKS_SLUG, VALID_CHECK_SLUGS } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import makeId from '../utils/makeId.js';
import setNonEnumerableProperty from '../utils/setNonEnumerableProperty.js';

const builtInSlugs = Object.keys(VALID_CHECK_SLUGS);
const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function isBuiltInSlug(slug) {
  return builtInSlugs.includes(slug) || slug === PLUGIN_CHECKS_SLUG;
}

// Plugin rule ids are only known once the rules runner loads each plugin's
// ./checks, so any kebab-case slug is accepted here.
function isCheckSlug(slug) {
  return typeof slug === 'string' && (isBuiltInSlug(slug) || kebabCase.test(slug));
}

// Records a slug that may be a plugin rule id, so the rules runner can report
// it once rules load if no rule has it. addKeys runs more than once per build,
// so a node is recorded once per slug.
function recordPluginCheckSlug({ context, slug, configKey }) {
  if (!context.pluginCheckSlugRefs.has(slug)) {
    context.pluginCheckSlugRefs.set(slug, []);
  }
  const configKeys = context.pluginCheckSlugRefs.get(slug);
  if (!configKeys.includes(configKey)) {
    configKeys.push(configKey);
  }
}

function recArray({ array, arrayKey, keyMap, parentKeyMapId, context }) {
  let arrayKeyMapId;

  if (array['~k']) {
    arrayKeyMapId = array['~k'];
  } else {
    arrayKeyMapId = makeId.next();
    const entry = {
      key: arrayKey,
      '~k_parent': parentKeyMapId,
    };
    if (array['~r'] !== undefined) entry['~r'] = array['~r'];
    if (array['~l'] !== undefined) entry['~l'] = array['~l'];
    keyMap[arrayKeyMapId] = entry;
    Object.defineProperty(array, '~k', {
      value: arrayKeyMapId,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    delete array['~r'];
    delete array['~l'];
  }

  array.forEach((item, index) => {
    if (type.isObject(item)) {
      let path = `${arrayKey}[${index}]`;
      // TODO: Convert all artifacts to not modify id.
      const id =
        item.blockId ??
        item.menuId ??
        item.menuItemId ??
        item.requestId ??
        item.connectionId ??
        item.id;
      if (id) {
        path = `${path.slice(0, -1)}:${id}]`;
      }
      if (item.type) {
        path = `${path.slice(0, -1)}:${item.type}]`;
      }
      recAddKeys({
        object: item,
        key: path,
        keyMap: keyMap,
        parentKeyMapId: arrayKeyMapId,
        context,
      });
    }
    if (type.isArray(item)) {
      recArray({
        array: item,
        arrayKey: `${arrayKey}[${index}]`,
        keyMap,
        parentKeyMapId: arrayKeyMapId,
        context,
      });
    }
  });
}

function recAddKeys({ object, key, keyMap, parentKeyMapId, context }) {
  let keyMapId;
  let storedKey = key;

  // Skip objects that already have a ~k (already processed)
  if (object['~k']) {
    keyMapId = object['~k'];
    // Use the stored key from keyMap for correct child paths
    storedKey = keyMap[keyMapId]?.key ?? key;
  } else {
    keyMapId = makeId.next();
    const entry = {
      key,
      '~k_parent': parentKeyMapId,
    };
    if (object['~r'] !== undefined) entry['~r'] = object['~r'];
    if (object['~l'] !== undefined) entry['~l'] = object['~l'];

    // Add entry to keyMap BEFORE validation so errors can resolve location
    keyMap[keyMapId] = entry;

    // Handle ~ignoreBuildChecks property
    if (object['~ignoreBuildChecks'] !== undefined) {
      const checks = object['~ignoreBuildChecks'];

      if (Array.isArray(checks)) {
        const invalid = checks.filter((slug) => !isCheckSlug(slug));
        if (invalid.length > 0) {
          collectExceptions(
            context,
            new ConfigError(
              `Invalid check slug(s): "${invalid.join('", "')}". Check slugs are kebab-case: a built-in slug (${builtInSlugs.join(', ')}), ${PLUGIN_CHECKS_SLUG}, or a plugin rule id.`,
              { configKey: keyMapId }
            )
          );
        }
        checks
          .filter((slug) => isCheckSlug(slug) && !isBuiltInSlug(slug))
          .forEach((slug) => recordPluginCheckSlug({ context, slug, configKey: keyMapId }));
      } else if (checks !== true) {
        collectExceptions(
          context,
          new ConfigError('~ignoreBuildChecks must be true or an array of check slugs.', {
            received: checks,
            configKey: keyMapId,
          })
        );
      }

      entry['~ignoreBuildChecks'] = checks;
    }
    setNonEnumerableProperty(object, '~k', keyMapId);
    delete object['~r'];
    delete object['~l'];
    delete object['~ignoreBuildChecks'];
  }

  // Always recurse into children (they may be new objects without keys)
  Object.keys(object).forEach((nextKey) => {
    if (type.isObject(object[nextKey])) {
      recAddKeys({
        object: object[nextKey],
        key: `${storedKey}.${nextKey}`,
        keyMap: keyMap,
        parentKeyMapId: keyMapId,
        context,
      });
    }
    if (type.isArray(object[nextKey])) {
      recArray({
        array: object[nextKey],
        arrayKey: `${storedKey}.${nextKey}`,
        keyMap,
        parentKeyMapId: keyMapId,
        context,
      });
    }
  });
}

function addKeys({ components, context }) {
  const keyMapId = makeId.next();
  recAddKeys({
    object: components,
    key: 'root',
    keyMap: context.keyMap,
    parentKeyMapId: keyMapId,
    context,
  });
}

export default addKeys;
