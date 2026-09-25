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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';

// Operators known not to produce strings. Any other operator can assemble tag
// syntax at render time from content the html scan passed.
const NON_STRING_OPERATORS = new Set([
  '_and',
  '_eq',
  '_gt',
  '_gte',
  '_if',
  '_if_none',
  '_lt',
  '_lte',
  '_ne',
  '_not',
  '_or',
  '_state',
  '_switch',
]);

const DEFAULT_LIMITS = {
  depth: 10,
  blocks: 500,
  bytes: 262144,
  actionsPerEvent: 20,
};

function readStringList({ policy, key, value }) {
  if (type.isNone(value)) {
    return [];
  }
  if (!type.isArray(value) || !value.every((item) => type.isString(item))) {
    throw new ConfigError(`Dynamic policy "${policy.id}" "${key}" should be an array of strings.`, {
      received: value,
      configKey: policy['~k'],
    });
  }
  return [...value];
}

function checkTypesExist({ policy, key, names, definitions }) {
  names.forEach((name) => {
    if (type.isNone(definitions[name])) {
      throw new ConfigError(
        `Dynamic policy "${policy.id}" "${key}" lists "${name}", which is not an installed type.`,
        { configKey: policy['~k'] }
      );
    }
  });
}

function checkOperators({ policy, operators, definitions }) {
  operators.forEach((name) => {
    if (!name.startsWith('_') || name.includes('.')) {
      throw new ConfigError(
        `Dynamic policy "${policy.id}" "operators" lists "${name}". List operator base names such as "_string", which allows every "_string" method.`,
        { configKey: policy['~k'] }
      );
    }
    // _operator calls any operator by name at runtime, so listing it would
    // allow every operator.
    if (name === '_operator') {
      throw new ConfigError(
        `Dynamic policy "${policy.id}" cannot list "_operator": it calls any operator by name, which would defeat the operator list.`,
        { configKey: policy['~k'] }
      );
    }
  });
  checkTypesExist({ policy, key: 'operators', names: operators, definitions });
}

function checkOrigins({ policy, origins }) {
  origins.forEach((origin) => {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      parsed = null;
    }
    if (type.isNone(parsed) || parsed.origin === 'null' || parsed.origin !== origin) {
      throw new ConfigError(
        `Dynamic policy "${policy.id}" "links.origins" lists "${origin}". Origins are a scheme, host and optional port with no path, such as "https://example.com".`,
        { configKey: policy['~k'] }
      );
    }
  });
}

function buildPolicy({ policy, context }) {
  const { typesMap } = context;
  const blocks = readStringList({ policy, key: 'blocks', value: policy.blocks });
  const actions = readStringList({ policy, key: 'actions', value: policy.actions });
  const operators = readStringList({ policy, key: 'operators', value: policy.operators });
  const endpoints = readStringList({ policy, key: 'endpoints', value: policy.endpoints });
  const requests = readStringList({ policy, key: 'requests', value: policy.requests });
  const pages = readStringList({ policy, key: 'links.pages', value: policy.links?.pages });
  const origins = readStringList({ policy, key: 'links.origins', value: policy.links?.origins });
  // A nested Dynamic block would call its own endpoint and bring content no
  // policy checks.
  if (blocks.includes('Dynamic')) {
    throw new ConfigError(
      `Dynamic policy "${policy.id}" cannot list "Dynamic" in "blocks": nested Dynamic content would escape the policy.`,
      { configKey: policy['~k'] }
    );
  }
  checkTypesExist({ policy, key: 'blocks', names: blocks, definitions: typesMap.blocks });
  checkTypesExist({ policy, key: 'actions', names: actions, definitions: typesMap.actions });
  checkOperators({ policy, operators, definitions: typesMap.operators.client });
  checkOrigins({ policy, origins });
  if (!type.isNone(policy.state) && (!type.isString(policy.state) || policy.state === '')) {
    throw new ConfigError(`Dynamic policy "${policy.id}" "state" should be a non-empty string.`, {
      received: policy.state,
      configKey: policy['~k'],
    });
  }
  if (!type.isNone(policy.html) && !type.isBoolean(policy.html)) {
    throw new ConfigError(`Dynamic policy "${policy.id}" "html" should be a boolean.`, {
      received: policy.html,
      configKey: policy['~k'],
    });
  }
  const stringOperators = operators.filter((name) => !NON_STRING_OPERATORS.has(name));
  if (policy.html !== true && stringOperators.length > 0) {
    context.handleWarning(
      new ConfigWarning(
        `Dynamic policy "${policy.id}" does not allow HTML but lists ${stringOperators
          .map((name) => `"${name}"`)
          .join(', ')}, which can build HTML at render time that the content check cannot see.`,
        { configKey: policy['~k'] }
      )
    );
  }
  const limits = { ...DEFAULT_LIMITS };
  Object.keys(policy.limits ?? {}).forEach((key) => {
    if (key.startsWith('~')) return;
    const value = policy.limits[key];
    if (type.isUndefined(DEFAULT_LIMITS[key]) || !type.isInt(value) || value < 1) {
      throw new ConfigError(
        `Dynamic policy "${policy.id}" "limits.${key}" should be one of depth, blocks, bytes or actionsPerEvent, with a positive integer value.`,
        { received: value, configKey: policy['~k'] }
      );
    }
    limits[key] = value;
  });
  return {
    id: policy.id,
    blocks,
    actions,
    operators,
    endpoints,
    requests,
    links: { pages, origins },
    state: policy.state ?? null,
    html: policy.html ?? false,
    limits,
  };
}

// Policies are built before pages and api, so buildDynamicBlock and the
// ValidateDynamic step checks can read context.dynamicPolicies.
function buildDynamicPolicies({ components, context }) {
  context.dynamicPolicies = Object.create(null);
  const checkDuplicatePolicyId = createCheckDuplicateId({
    message: 'Duplicate dynamic policy id "{{ id }}".',
  });
  (components.dynamicPolicies ?? []).forEach((policy) => {
    try {
      if (!type.isObject(policy)) {
        throw new ConfigError('Dynamic policy should be an object.', { received: policy });
      }
      if (!type.isString(policy.id)) {
        throw new ConfigError('Dynamic policy "id" should be a string.', {
          received: policy.id,
          configKey: policy['~k'],
        });
      }
      checkDuplicatePolicyId({ id: policy.id, configKey: policy['~k'] });
      context.dynamicPolicies[policy.id] = buildPolicy({ policy, context });
    } catch (error) {
      collectExceptions(context, error);
    }
  });
  return components;
}

export default buildDynamicPolicies;
