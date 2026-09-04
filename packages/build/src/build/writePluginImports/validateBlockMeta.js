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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import collectExceptions from '../../utils/collectExceptions.js';
import validateHazardsShape from './validateHazardsShape.js';

const CATEGORIES = ['display', 'input', 'input-container', 'container', 'list'];
const VALUE_TYPES = ['any', 'array', 'boolean', 'date', 'number', 'object', 'primitive', 'string'];
// The meta shape is documented in code-docs/architecture/plugin-api.md.
const KNOWN_KEYS = [
  'category',
  'cssKeys',
  'dynamicEvents',
  'events',
  'hazards',
  'icons',
  'initValue',
  'methods',
  'properties',
  'slots',
  'styles',
  'valueType',
];

function received(value) {
  return JSON.stringify(value);
}

function isObjectOfStrings(value) {
  return type.isObject(value) && Object.values(value).every((v) => type.isString(v));
}

// Mirrors extractEventPayloads in block-utils: a description string, or
// { description, payload: <JSON Schema> }; the legacy { description, event:
// { key: description } } form is still normalised to a payload there.
function isEventDefinition(value) {
  if (type.isString(value)) return true;
  if (!type.isObject(value)) return false;
  if (!type.isString(value.description)) return false;
  if (!type.isUndefined(value.payload) && !type.isObject(value.payload)) return false;
  return type.isUndefined(value.event) || isObjectOfStrings(value.event);
}

// A description string, or { description, params: { name: description } } —
// the params object documents the method's arguments for docs and agents.
function isMethodDefinition(value) {
  if (type.isString(value)) return true;
  if (!type.isObject(value)) return false;
  if (!type.isString(value.description)) return false;
  return type.isUndefined(value.params) || isObjectOfStrings(value.params);
}

// A file plugin declares its meta in the sibling JSON beside the file, a
// package block in the package's metas module. Both are held to this contract;
// only the source named in the message differs.
function siblingJsonPath(filePlugin) {
  return filePlugin.relativePath.replace(/\.[^./]+$/, '.json');
}

// Checks the meta a block plugin exports for one block type. Every violation
// is collected as a ConfigError so one bad plugin reports all of its bad
// fields in a single build; unknown keys are a ConfigWarning and stay allowed.
// Returns true when the meta is usable by buildBlockSchema and the client.
function validateBlockMeta({ context, filePlugin, meta, packageName, typeName }) {
  const errors = [];
  const source = filePlugin ? `from "${filePlugin.relativePath}"` : `from package "${packageName}"`;
  const location = filePlugin
    ? { filePath: filePlugin.relativePath, lineNumber: 1, checkSlug: filePlugin.checkSlug }
    : {};
  const fail = (message, value) => {
    errors.push(
      new ConfigError(`Block type "${typeName}" ${source}: ${message}`, {
        received: value,
        ...location,
      })
    );
  };

  if (type.isNone(meta)) {
    fail(
      filePlugin
        ? `has no meta. Declare it in "${siblingJsonPath(
            filePlugin
          )}" as { "meta": { ... } } with at least { category }.`
        : `has no meta. Export it from "${packageName}/metas" as { ${typeName}: meta } with at least { category }.`,
      meta
    );
  } else if (!type.isObject(meta)) {
    fail(`meta must be a plain object. Received ${received(meta)}.`, meta);
  } else {
    if (type.isNone(meta.category)) {
      fail(`meta.category is missing. Expected one of ${received(CATEGORIES)}.`, meta.category);
    } else if (!CATEGORIES.includes(meta.category)) {
      fail(
        `meta.category must be one of ${received(CATEGORIES)}. Received ${received(
          meta.category
        )}.`,
        meta.category
      );
    }

    const hasValueType = !type.isUndefined(meta.valueType) && meta.valueType !== null;
    if (hasValueType && !VALUE_TYPES.includes(meta.valueType)) {
      fail(
        `meta.valueType must be null or one of ${received(VALUE_TYPES)}. Received ${received(
          meta.valueType
        )}.`,
        meta.valueType
      );
    }
    if (!type.isUndefined(meta.initValue) && !hasValueType) {
      fail(
        `meta.initValue requires a meta.valueType, but valueType is ${received(
          meta.valueType
        )}. Received initValue ${received(meta.initValue)}.`,
        meta.initValue
      );
    }

    if (
      !type.isUndefined(meta.icons) &&
      !(type.isArray(meta.icons) && meta.icons.every((icon) => type.isString(icon)))
    ) {
      fail(`meta.icons must be an array of strings. Received ${received(meta.icons)}.`, meta.icons);
    }
    if (
      !type.isUndefined(meta.styles) &&
      !(type.isArray(meta.styles) && meta.styles.every((style) => type.isString(style)))
    ) {
      fail(
        `meta.styles must be an array of strings. Received ${received(meta.styles)}.`,
        meta.styles
      );
    }
    if (!type.isUndefined(meta.properties) && !type.isObject(meta.properties)) {
      fail(
        `meta.properties must be a JSON Schema object. Received ${received(meta.properties)}.`,
        meta.properties
      );
    }
    // slots: false declares dynamic slot names (validateSlots skips the check);
    // an array of names is the older form without descriptions.
    const slotsValid =
      type.isUndefined(meta.slots) ||
      meta.slots === false ||
      isObjectOfStrings(meta.slots) ||
      (type.isArray(meta.slots) && meta.slots.every((slot) => type.isString(slot)));
    if (!slotsValid) {
      fail(
        `meta.slots must be an object of { name: description } strings, an array of names, or false for dynamic slots. Received ${received(
          meta.slots
        )}.`,
        meta.slots
      );
    }
    if (!type.isUndefined(meta.cssKeys) && !isObjectOfStrings(meta.cssKeys)) {
      fail(
        `meta.cssKeys must be an object of { name: description } strings. Received ${received(
          meta.cssKeys
        )}.`,
        meta.cssKeys
      );
    }
    if (!type.isUndefined(meta.methods)) {
      if (!type.isObject(meta.methods)) {
        fail(
          `meta.methods must be an object of { methodName: description | { description, params } }. Received ${received(
            meta.methods
          )}.`,
          meta.methods
        );
      } else {
        Object.entries(meta.methods).forEach(([name, definition]) => {
          if (!isMethodDefinition(definition)) {
            fail(
              `meta.methods.${name} must be a description string or { description: string, params?: { name: description } strings }. Received ${received(
                definition
              )}.`,
              definition
            );
          }
        });
      }
    }
    if (!type.isUndefined(meta.events)) {
      if (!type.isObject(meta.events)) {
        fail(
          `meta.events must be an object of { eventName: description | { description, payload } }. Received ${received(
            meta.events
          )}.`,
          meta.events
        );
      } else {
        Object.entries(meta.events).forEach(([name, definition]) => {
          if (!isEventDefinition(definition)) {
            fail(
              `meta.events.${name} must be a description string or { description: string, payload?: <JSON Schema object> }. Received ${received(
                definition
              )}.`,
              definition
            );
          }
        });
      }
    }
    if (!type.isUndefined(meta.dynamicEvents) && !type.isBoolean(meta.dynamicEvents)) {
      fail(
        `meta.dynamicEvents must be a boolean. Received ${received(meta.dynamicEvents)}.`,
        meta.dynamicEvents
      );
    }
    const hazardsProblem = validateHazardsShape(meta.hazards);
    if (hazardsProblem !== null) {
      fail(`meta.${hazardsProblem}`, meta.hazards);
    }

    const unknownKeys = Object.keys(meta).filter((key) => !KNOWN_KEYS.includes(key));
    if (unknownKeys.length > 0) {
      context.handleWarning(
        new ConfigWarning(
          `Block type "${typeName}" ${source}: meta has unknown keys ${received(
            unknownKeys
          )}. Known keys are ${received(
            KNOWN_KEYS
          )}. Unknown keys are ignored by the build and the client.`,
          { received: unknownKeys }
        )
      );
    }
  }

  errors.forEach((error) => collectExceptions(context, error));
  return errors.length === 0;
}

export default validateBlockMeta;
