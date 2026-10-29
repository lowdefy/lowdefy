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
import {
  ConfigError,
  PLUGIN_CHECKS_SLUG,
  resolveKeyEntry,
  VALID_CHECK_SLUGS,
} from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import makeId from '../utils/makeId.js';
import isKebabCaseSlug from '../utils/isKebabCaseSlug.js';
import setNonEnumerableProperty from '../utils/setNonEnumerableProperty.js';

const builtInSlugs = Object.keys(VALID_CHECK_SLUGS);

function isBuiltInSlug(slug) {
  return builtInSlugs.includes(slug) || slug === PLUGIN_CHECKS_SLUG;
}

// Plugin rule ids are only known once the rules runner loads each plugin's
// ./checks, so any kebab-case slug is accepted here.
function isCheckSlug(slug) {
  return typeof slug === 'string' && (isBuiltInSlug(slug) || isKebabCaseSlug(slug));
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

// The ref a node resolves to: its own ~r, or none. The parent's ref is not
// inherited: a node the build creates under a _ref'd parent has no ~r, and it
// resolves to lowdefy.yaml.
function ownRef(node) {
  return node['~r'] ?? null;
}

// Short key map entry, { s, p, r?, l? }: the node's own path segment and its
// parent's id. r is written only where the node's ref differs from its
// parent's resolved ref (null for no ref under a parent that has one), so the
// readers in @lowdefy/errors inherit it down the chain.
function createEntry({ node, segment, parentKeyMapId, parentRef }) {
  const entry = { s: segment, p: parentKeyMapId };
  const ref = ownRef(node);
  if (ref !== parentRef) entry.r = ref;
  if (node['~l'] !== undefined) entry.l = node['~l'];
  return entry;
}

// The resolved ref of a node keyed on an earlier pass. Under the parent it was
// keyed under, its entry inherits from the ref passed down; a node a build step
// moved under another parent resolves its own chain once.
function keyedRef({ keyMap, keyMapId, parentKeyMapId, parentRef }) {
  const entry = keyMap[keyMapId];
  if (entry?.p === parentKeyMapId) {
    return entry.r !== undefined ? entry.r : parentRef;
  }
  return resolveKeyEntry({ keyMap, configKey: keyMapId })?.refId ?? null;
}

function arrayItemSegment({ index, item }) {
  let segment = `[${index}]`;
  // TODO: Convert all artifacts to not modify id.
  const id =
    item.blockId ??
    item.menuId ??
    item.menuItemId ??
    item.requestId ??
    item.connectionId ??
    item.id;
  if (id) {
    segment = `${segment.slice(0, -1)}:${id}]`;
  }
  if (item.type) {
    segment = `${segment.slice(0, -1)}:${item.type}]`;
  }
  return segment;
}

function recArray({ array, segment, keyMap, parentKeyMapId, parentRef, context }) {
  let arrayKeyMapId;
  let arrayRef;

  if (array['~k']) {
    arrayKeyMapId = array['~k'];
    arrayRef = keyedRef({ keyMap, keyMapId: arrayKeyMapId, parentKeyMapId, parentRef });
  } else {
    arrayKeyMapId = makeId.next();
    keyMap[arrayKeyMapId] = createEntry({ node: array, segment, parentKeyMapId, parentRef });
    arrayRef = ownRef(array);
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
      recAddKeys({
        object: item,
        segment: arrayItemSegment({ index, item }),
        keyMap,
        parentKeyMapId: arrayKeyMapId,
        parentRef: arrayRef,
        context,
      });
    }
    if (type.isArray(item)) {
      recArray({
        array: item,
        segment: `[${index}]`,
        keyMap,
        parentKeyMapId: arrayKeyMapId,
        parentRef: arrayRef,
        context,
      });
    }
  });
}

function recAddKeys({ object, segment, keyMap, parentKeyMapId, parentRef, context }) {
  let keyMapId;
  let objectRef;

  // Skip objects that already have a ~k (already processed)
  if (object['~k']) {
    keyMapId = object['~k'];
    objectRef = keyedRef({ keyMap, keyMapId, parentKeyMapId, parentRef });
  } else {
    keyMapId = makeId.next();
    const entry = createEntry({ node: object, segment, parentKeyMapId, parentRef });
    objectRef = ownRef(object);

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
              `Invalid check slug(s): "${invalid.join(
                '", "'
              )}". Check slugs are kebab-case: a built-in slug (${builtInSlugs.join(
                ', '
              )}), ${PLUGIN_CHECKS_SLUG}, or a plugin rule id.`,
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

      entry.i = checks;
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
        segment: `.${nextKey}`,
        keyMap,
        parentKeyMapId: keyMapId,
        parentRef: objectRef,
        context,
      });
    }
    if (type.isArray(object[nextKey])) {
      recArray({
        array: object[nextKey],
        segment: `.${nextKey}`,
        keyMap,
        parentKeyMapId: keyMapId,
        parentRef: objectRef,
        context,
      });
    }
  });
}

function addKeys({ components, context }) {
  const keyMapId = makeId.next();
  recAddKeys({
    object: components,
    segment: 'root',
    keyMap: context.keyMap,
    parentKeyMapId: keyMapId,
    parentRef: null,
    context,
  });
}

export default addKeys;
