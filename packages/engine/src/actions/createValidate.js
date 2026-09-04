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

import { compile, getSchemaAtPath } from '@lowdefy/ajv';
import { UserError } from '@lowdefy/errors';
import { get, type } from '@lowdefy/helpers';

import getBlockMatcher from '../getBlockMatcher.js';

function instancePathToStatePath(instancePath) {
  return instancePath
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .join('.');
}

function joinPath(prefix, path) {
  if (prefix === '') return path;
  if (path === '') return prefix;
  return `${prefix}.${path}`;
}

// A required-property error points at the object; the block it belongs to is
// the missing property itself.
function errorStatePath({ error, prefix }) {
  const path = instancePathToStatePath(error.instancePath);
  if (error.keyword === 'required') {
    return joinPath(prefix, joinPath(path, error.params.missingProperty));
  }
  return joinPath(prefix, path);
}

// A Validate action that targets a contract the page does not declare, or a
// path the contract does not name, is a build error (checkValidateActionSchemas)
// - not something the engine re-checks. The path miss below survives only for
// an app that suppressed that check.
function getSchemaValidator({ context, schema }) {
  const path = schema === true ? '' : schema;
  const fragment = getSchemaAtPath({ schema: context.stateSchemaRoot, path });
  if (fragment === null) {
    throw new Error(
      `Validate "schema" path "${schema}" is not part of the state contract of page "${context.pageId}".`
    );
  }
  if (type.isNone(context._internal.stateSchemaValidators)) {
    context._internal.stateSchemaValidators = {};
  }
  if (type.isNone(context._internal.stateSchemaValidators[path])) {
    context._internal.stateSchemaValidators[path] = compile({ schema: fragment });
  }
  return { path, validate: context._internal.stateSchemaValidators[path] };
}

// Runs the declared contract (or the sub-tree at params.schema) over the
// current state. Errors at a path that is a block on the page are attached to
// that block; the rest are reported as `state.<path>: <message>` lines.
function checkStateSchema({ context, schema }) {
  const { path, validate } = getSchemaValidator({ context, schema });
  const data = path === '' ? context.state : get(context.state, path);
  const { errors } = validate(data);
  const blockErrors = new Map();
  const unmatched = [];
  errors.forEach((error) => {
    const statePath = errorStatePath({ error, prefix: path });
    const block = context._internal.RootSlots.map[statePath];
    if (type.isNone(block)) {
      unmatched.push(`state.${statePath}: ${error.message}`);
      return;
    }
    if (!blockErrors.has(statePath)) blockErrors.set(statePath, []);
    blockErrors.get(statePath).push(error.message);
  });
  return { blockErrors, unmatched };
}

function createValidate({ context }) {
  return function validate(params) {
    const schema = type.isObject(params) ? params.schema : undefined;
    const hasSchema = schema === true || type.isString(schema);
    if (!type.isNone(schema) && !hasSchema) {
      throw new Error(
        `Validate "schema" should be true or a state path string. Received ${JSON.stringify(
          schema
        )}.`
      );
    }

    let blockParams = params;
    if (type.isObject(params)) {
      const { schema: _schema, ...rest } = params;
      // `{ schema: true }` alone selects no blocks; the block matcher matches
      // everything only when no params were given at all.
      blockParams = Object.keys(rest).length === 0 && hasSchema ? { blockIds: [] } : rest;
    }
    const matchBlock = getBlockMatcher(blockParams);

    let schemaResult = { blockErrors: new Map(), unmatched: [] };
    if (hasSchema) {
      schemaResult = checkStateSchema({ context, schema });
      Object.values(context._internal.RootSlots.map).forEach((block) => {
        block.schemaErrors = schemaResult.blockErrors.get(block.blockId) ?? [];
      });
    }
    const match = (id) => matchBlock(id) || schemaResult.blockErrors.has(id);

    const validationErrors = context._internal.RootSlots.validate(match);
    const count = validationErrors.length + schemaResult.unmatched.length;
    if (count > 0) {
      const summary = context._internal.lowdefy._internal.translate('engine.validation.summary', {
        count,
      });
      throw new UserError([summary, ...schemaResult.unmatched].join('\n'));
    }
  };
}

export default createValidate;
