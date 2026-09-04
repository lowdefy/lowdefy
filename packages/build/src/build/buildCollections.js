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

import { normalizeSchemaShorthand } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';

const COLLECTION_KEYS = ['tenant', 'fields', 'relations', 'indexes', 'required'];
const FIELD_KEYS = ['type', 'enum', 'items', 'properties', 'required', 'description', 'pii'];

// A collection is a property of the database, not of a connection: one
// collection is routinely addressed by several connections (a read-only one,
// a writing one, a shared-catalogue one), so the declaration lives at the app
// root and the build joins it to connections by properties.collection. The
// normalised result is written to build/collections.json for the data-layer
// consumers (data model tool, write validation, migrations) and consulted by
// validateTenantPipeline as its first source of sharedness.

function collectionError(message, { configKey, received }) {
  return new ConfigError(message, { configKey, received, checkSlug: 'collections' });
}

function normalizeTenant({ name, tenant, configKey }) {
  if (tenant === 'shared') {
    return 'shared';
  }
  if (type.isString(tenant) && tenant !== '' && !tenant.includes('.')) {
    return { field: tenant };
  }
  throw collectionError(
    `Collection "${name}" tenant must be "shared" or a tenant field name. Received ${JSON.stringify(
      tenant
    )}.`,
    { configKey, received: tenant }
  );
}

// A field declaration is JSON Schema, written with the shared shorthand:
// `string`, `[string]`, `{ enum: [...] }`, `date`. normalizeSchemaShorthand
// owns the expansion so `fields:`, `state:`, `payloadSchema` and
// `responseSchema` all read one vocabulary; `date` becomes
// { type: string, format: date-time }, the shape a date has on the wire.
function normalizeField({ name, fieldName, field, configKey }) {
  if (type.isObject(field)) {
    const unknownKeys = Object.keys(field).filter(
      (key) => !FIELD_KEYS.includes(key) && !key.startsWith('~')
    );
    if (unknownKeys.length > 0) {
      throw collectionError(
        `Collection "${name}" field "${fieldName}" has unknown key(s) "${unknownKeys.join(
          '", "'
        )}". Valid keys: ${FIELD_KEYS.join(', ')}.`,
        { configKey: field['~k'] ?? configKey, received: field }
      );
    }
    if (!type.isUndefined(field.enum) && (!type.isArray(field.enum) || field.enum.length === 0)) {
      throw collectionError(
        `Collection "${name}" field "${fieldName}" enum must be a non-empty array. Received ${JSON.stringify(
          field.enum
        )}.`,
        { configKey: field['~k'] ?? configKey, received: field.enum }
      );
    }
    if (!type.isUndefined(field.required) && !type.isBoolean(field.required)) {
      throw collectionError(
        `Collection "${name}" field "${fieldName}" required must be a boolean. Use the collection-level "required: [${fieldName}]" array instead. Received ${JSON.stringify(
          field.required
        )}.`,
        { configKey: field['~k'] ?? configKey, received: field.required }
      );
    }
  } else if (!type.isString(field) && !type.isArray(field)) {
    throw collectionError(
      `Collection "${name}" field "${fieldName}" must be a type name, a [type] array shorthand or an object with type, enum, items, properties or required. Received ${JSON.stringify(
        field
      )}.`,
      { configKey, received: field }
    );
  }
  if (type.isObject(field) && !type.isUndefined(field.pii) && !type.isBoolean(field.pii)) {
    throw collectionError(
      `Collection "${name}" field "${fieldName}" pii must be a boolean. Received ${JSON.stringify(
        field.pii
      )}.`,
      { configKey: field['~k'] ?? configKey, received: field.pii }
    );
  }
  try {
    // pii is a Lowdefy annotation, not a JSON Schema keyword; it is collected
    // on the collection (see normalizeFields) and kept out of the fragment.
    const declaration = type.isObject(field) ? { ...field } : field;
    if (type.isObject(declaration)) delete declaration.pii;
    return normalizeSchemaShorthand({ schema: stripMarkers(declaration) });
  } catch (error) {
    throw collectionError(
      `Collection "${name}" field "${fieldName}" is not a valid declaration: ${error.message}`,
      { configKey: field?.['~k'] ?? configKey, received: field }
    );
  }
}

// `required: true` beside a field's type is the one place Lowdefy config spelt
// `required` differently from JSON Schema, and it made build/collections.json
// uncompilable. It is folded into the parent's `required` array - at every
// depth, so a nested `properties` map is valid JSON Schema too - and reported
// once per field so the declaration can be moved.
function foldRequiredFlags({ node, onFolded }) {
  if (!type.isObject(node)) return node;
  const folded = { ...node };
  const requiredNames = type.isArray(folded.required) ? [...folded.required] : [];
  if (folded.required === true) delete folded.required;
  if (type.isObject(folded.properties)) {
    const properties = {};
    Object.keys(folded.properties).forEach((key) => {
      const child = folded.properties[key];
      if (type.isObject(child) && child.required === true) {
        requiredNames.push(key);
        onFolded(key);
      }
      properties[key] = foldRequiredFlags({ node: child, onFolded });
    });
    folded.properties = properties;
  }
  if (type.isObject(folded.items)) {
    folded.items = foldRequiredFlags({ node: folded.items, onFolded });
  }
  if (requiredNames.length > 0) {
    folded.required = [...new Set(requiredNames)];
  }
  return folded;
}

function normalizeRequired({ name, required, configKey }) {
  if (type.isUndefined(required)) return [];
  if (!type.isArray(required) || required.some((entry) => !type.isString(entry))) {
    throw collectionError(
      `Collection "${name}" required must be an array of field names. Received ${JSON.stringify(
        required
      )}.`,
      { configKey, received: required }
    );
  }
  return [...required];
}

function normalizeFields({ name, declaration, configKey, context }) {
  const { fields } = declaration;
  const declaredRequired = normalizeRequired({
    name,
    required: declaration.required,
    configKey,
  });
  if (type.isUndefined(fields)) {
    return { fields: undefined, required: declaredRequired, pii: [] };
  }
  if (!type.isObject(fields)) {
    throw collectionError(
      `Collection "${name}" fields must be an object of field name to type. Received ${JSON.stringify(
        fields
      )}.`,
      { configKey, received: fields }
    );
  }
  const normalized = {};
  const pii = [];
  Object.keys(fields).forEach((fieldName) => {
    if (fieldName.startsWith('~')) return;
    if (type.isObject(fields[fieldName]) && fields[fieldName].pii === true) {
      pii.push(fieldName);
    }
    normalized[fieldName] = normalizeField({
      name,
      fieldName,
      field: fields[fieldName],
      configKey: fields['~k'] ?? configKey,
    });
  });
  const root = foldRequiredFlags({
    node: { properties: normalized, required: declaredRequired },
    onFolded: (fieldName) => {
      context.handleWarning(
        new ConfigWarning(
          `Collection "${name}" field "${fieldName}" declares "required: true". Declare it as the collection-level array instead: required: [${fieldName}].`,
          { configKey, checkSlug: 'collections' }
        )
      );
    },
  });
  return { fields: root.properties, required: root.required ?? [], pii };
}

function normalizeIndexes({ name, indexes, configKey }) {
  if (type.isUndefined(indexes)) {
    return [];
  }
  if (!type.isArray(indexes)) {
    throw collectionError(
      `Collection "${name}" indexes must be an array. Received ${JSON.stringify(indexes)}.`,
      { configKey, received: indexes }
    );
  }
  return indexes.map((index) => {
    if (!type.isObject(index) || !type.isObject(index.keys)) {
      throw collectionError(
        `Collection "${name}" index must be an object with a "keys" object and an optional "options" object. Received ${JSON.stringify(
          index
        )}.`,
        { configKey: index?.['~k'] ?? configKey, received: index }
      );
    }
    if (!type.isUndefined(index.options) && !type.isObject(index.options)) {
      throw collectionError(
        `Collection "${name}" index options must be an object. Received ${JSON.stringify(
          index.options
        )}.`,
        { configKey: index['~k'] ?? configKey, received: index.options }
      );
    }
    const normalized = { keys: stripMarkers(index.keys) };
    if (!type.isUndefined(index.options)) {
      normalized.options = stripMarkers(index.options);
    }
    return normalized;
  });
}

function stripMarkers(value) {
  if (type.isArray(value)) {
    return value.map(stripMarkers);
  }
  if (!type.isObject(value)) {
    return value;
  }
  const out = {};
  Object.keys(value).forEach((key) => {
    if (key.startsWith('~')) return;
    out[key] = stripMarkers(value[key]);
  });
  return out;
}

function parseRelations({ name, relations, configKey }) {
  if (type.isUndefined(relations)) {
    return {};
  }
  if (!type.isObject(relations)) {
    throw collectionError(
      `Collection "${name}" relations must be an object of field name to "<collection>.<field>". Received ${JSON.stringify(
        relations
      )}.`,
      { configKey, received: relations }
    );
  }
  const parsed = {};
  Object.keys(relations).forEach((fieldName) => {
    if (fieldName.startsWith('~')) return;
    const target = relations[fieldName];
    const dot = type.isString(target) ? target.indexOf('.') : -1;
    if (dot <= 0 || dot === target.length - 1) {
      throw collectionError(
        `Collection "${name}" relation "${fieldName}" must be a "<collection>.<field>" string. Received ${JSON.stringify(
          target
        )}.`,
        { configKey: relations['~k'] ?? configKey, received: target }
      );
    }
    parsed[fieldName] = {
      collection: target.slice(0, dot),
      field: target.slice(dot + 1),
      configKey: relations['~k'] ?? configKey,
    };
  });
  return parsed;
}

function normalizeCollection({ name, declaration, context }) {
  const configKey = declaration?.['~k'];
  if (!type.isObject(declaration)) {
    throw collectionError(
      `Collection "${name}" must be an object. Received ${JSON.stringify(declaration)}.`,
      { configKey, received: declaration }
    );
  }
  const unknownKeys = Object.keys(declaration).filter(
    (key) => !COLLECTION_KEYS.includes(key) && !key.startsWith('~')
  );
  if (unknownKeys.length > 0) {
    throw collectionError(
      `Collection "${name}" has unknown key(s) "${unknownKeys.join(
        '", "'
      )}". Valid keys: ${COLLECTION_KEYS.join(', ')}.`,
      { configKey, received: declaration }
    );
  }
  const { fields, required, pii } = normalizeFields({ name, declaration, configKey, context });
  const collection = {
    fields,
    required,
    pii,
    relations: parseRelations({ name, relations: declaration.relations, configKey }),
    indexes: normalizeIndexes({ name, indexes: declaration.indexes, configKey }),
    connections: [],
    configKey,
  };
  if (!type.isUndefined(declaration.tenant)) {
    collection.tenant = normalizeTenant({ name, tenant: declaration.tenant, configKey });
  }
  context.collections[name] = collection;
}

// Relations are resolved after every collection is normalised so the target
// may be declared later in the file. A target collection that declares no
// fields at all accepts any field name - it has opted out of the shape.
function validateRelations({ collections, context }) {
  Object.keys(collections).forEach((name) => {
    Object.keys(collections[name].relations).forEach((fieldName) => {
      const relation = collections[name].relations[fieldName];
      const target = collections[relation.collection];
      const targetPath = `${relation.collection}.${relation.field}`;
      if (type.isUndefined(target)) {
        collectExceptions(
          context,
          collectionError(
            `Collection "${name}" relation "${fieldName}" targets "${targetPath}", but collection "${
              relation.collection
            }" is not declared. Declared collections: ${Object.keys(collections).join(', ')}.`,
            { configKey: relation.configKey, received: targetPath }
          )
        );
        return;
      }
      if (!type.isUndefined(target.fields) && type.isUndefined(target.fields[relation.field])) {
        collectExceptions(
          context,
          collectionError(
            `Collection "${name}" relation "${fieldName}" targets "${targetPath}", which "${
              relation.collection
            }" does not declare. Fields: ${Object.keys(target.fields).join(', ')}.`,
            { configKey: relation.configKey, received: targetPath }
          )
        );
      }
    });
  });
}

function describeTenant(tenant) {
  if (tenant === 'shared') {
    return 'declared shared';
  }
  return `tenant-scoped on "${tenant.field}"`;
}

function tenantsAgree(a, b) {
  if (a === 'shared' || b === 'shared') {
    return a === b;
  }
  return a.field === b.field;
}

// A connection that declares no tenant against a collection that does is not
// an error here - it may deliberately be an admin path - and is reported by
// the check-only collections-untenanted-connection rule instead.
function joinConnections({ collections, context }) {
  (context.connectionCollections ?? []).forEach((binding) => {
    if (type.isUndefined(binding.collection)) return;
    const collection = collections[binding.collection];
    if (type.isUndefined(collection)) return;
    collection.connections.push({
      connectionId: binding.connectionId,
      read: binding.read,
      write: binding.write,
      tenant: binding.tenant,
    });
    if (type.isUndefined(collection.tenant) || type.isUndefined(binding.tenant)) return;
    if (tenantsAgree(collection.tenant, binding.tenant)) return;
    collectExceptions(
      context,
      collectionError(
        `Connection "${binding.connectionId}" is ${describeTenant(
          binding.tenant
        )} but collection "${binding.collection}" is ${describeTenant(
          collection.tenant
        )}. One of the two is wrong — a scoped read of a shared collection matches nothing.`,
        { configKey: binding.configKey, received: binding.tenant }
      )
    );
  });
}

function buildCollections({ components, context }) {
  context.collections = {};
  if (type.isUndefined(components.collections)) {
    return components;
  }
  if (!type.isObject(components.collections)) {
    collectExceptions(
      context,
      collectionError(
        `App "collections" must be an object of collection name to declaration. Received ${JSON.stringify(
          components.collections
        )}.`,
        { configKey: components.collections?.['~k'], received: components.collections }
      )
    );
    return components;
  }
  Object.keys(components.collections).forEach((name) => {
    if (name.startsWith('~')) return;
    try {
      normalizeCollection({ name, declaration: components.collections[name], context });
    } catch (error) {
      collectExceptions(context, error);
    }
  });
  validateRelations({ collections: context.collections, context });
  joinConnections({ collections: context.collections, context });
  return components;
}

export default buildCollections;
