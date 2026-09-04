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

import addKeys from './addKeys.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateId from '../utils/validateId.js';

const PROP_DEFINITION_KEYS = ['type', 'required', 'default', 'description'];
const PROP_TYPES = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'date', 'null'];

// Normalises the two authored shapes of components: into one keyed list.
// The map form { <id>: { props, slots, blocks } } is the primary form — an
// agent editing one component addresses it by name — and the v8-preview array
// form is a deprecated alias.
function readComponentList({ componentsConfig, context }) {
  if (type.isArray(componentsConfig)) {
    context.handleWarning(
      new ConfigWarning(
        'App "components" as an array is deprecated. Declare components as a map keyed by component id.',
        { configKey: componentsConfig['~k'], checkSlug: 'component' }
      )
    );
    return componentsConfig;
  }
  if (type.isObject(componentsConfig)) {
    return Object.keys(componentsConfig)
      .filter((id) => !id.startsWith('~'))
      .map((id) => {
        const component = componentsConfig[id];
        if (!type.isObject(component)) {
          throw new ConfigError(`Component "${id}" should be an object.`, {
            received: component,
            configKey: componentsConfig['~k'],
          });
        }
        if (!type.isUndefined(component.id) && component.id !== id) {
          throw new ConfigError(
            `Component "${id}" declares a different id "${component.id}". The map key is the component id.`,
            { configKey: component['~k'] }
          );
        }
        // Assigned rather than spread into a new object so the ~k marker
        // addKeys put on the definition survives and its errors keep their
        // location in the component file.
        component.id = id;
        return component;
      });
  }
  throw new ConfigError('App "components" should be a map of component definitions keyed by id.', {
    received: componentsConfig,
  });
}

function validatePropDefinitions({ component, configKey }) {
  for (const [name, propDef] of Object.entries(component.props ?? {})) {
    if (name.startsWith('~')) continue;
    if (!type.isObject(propDef)) {
      throw new ConfigError(
        `Component "${component.id}" prop "${name}" should be an object declaring { type, required, default, description }.`,
        { received: propDef, configKey }
      );
    }
    for (const key of Object.keys(propDef)) {
      if (key.startsWith('~')) continue;
      if (!PROP_DEFINITION_KEYS.includes(key)) {
        throw new ConfigError(
          `Component "${
            component.id
          }" prop "${name}" has an unknown key "${key}". Valid keys: ${PROP_DEFINITION_KEYS.join(
            ', '
          )}.`,
          { configKey }
        );
      }
    }
    if (!type.isUndefined(propDef.type) && !PROP_TYPES.includes(propDef.type)) {
      throw new ConfigError(
        `Component "${component.id}" prop "${name}" type should be one of ${PROP_TYPES.join(
          ', '
        )}.`,
        { received: propDef.type, configKey }
      );
    }
    if (!type.isUndefined(propDef.required) && !type.isBoolean(propDef.required)) {
      throw new ConfigError(
        `Component "${component.id}" prop "${name}" required should be a boolean.`,
        { received: propDef.required, configKey }
      );
    }
    if (!type.isUndefined(propDef.description) && !type.isString(propDef.description)) {
      throw new ConfigError(
        `Component "${component.id}" prop "${name}" description should be a string.`,
        { received: propDef.description, configKey }
      );
    }
  }
}

// Reads the top-level components: config, validates each component definition
// and registers it in context.componentDefs, keyed by its type name (its id).
// The definitions stay in the config tree until this step so that buildRefs,
// operator precompute and the JSON schema see them exactly as they see pages —
// build operators in a component body are evaluated, and _prop/_slot survive
// precompute because collectDynamicIdentifiers registers them.
function buildComponents({ components, context }) {
  const componentsConfig = components.components;
  delete components.components;
  if (type.isNone(componentsConfig)) return components;

  const componentList = readComponentList({ componentsConfig, context });

  // The JIT dev build runs this step before its addKeys pass, so key the
  // extracted list here — addKeys is idempotent, so this is a no-op in the full
  // build — and every error below and inside a component body resolves to the
  // component file.
  if (componentList.length > 0) {
    addKeys({ components: { components: componentList }, context });
  }

  const checkDuplicateComponentId = createCheckDuplicateId({
    message: 'Duplicate component id "{{ id }}".',
  });

  componentList.forEach((component, index) => {
    const configKey = component['~k'];
    if (type.isUndefined(component.id)) {
      throw new ConfigError(`Component id missing at component ${index}.`, { configKey });
    }
    if (!type.isString(component.id)) {
      throw new ConfigError(`Component id is not a string at component ${index}.`, {
        received: component.id,
        configKey,
      });
    }
    validateId({ id: component.id, field: 'Component id', configKey });
    checkDuplicateComponentId({ id: component.id, configKey });

    // A component type shares the block-type identifier space (Block.js resolves
    // both through one lookup), so a collision with an installed plugin block
    // type is a build error — two things cannot answer to one type:.
    // context.blockMetas is populated by loadBlockSchemas, which the full build
    // runs before this step. The dev shallow build has no block schemas loaded
    // at all when it extracts component defs, so there is nothing to compare
    // against there and the collision is caught by the next full build.
    if (type.isObject(context.blockMetas) && !type.isNone(context.blockMetas[component.id])) {
      throw new ConfigError(
        `Component "${component.id}" collides with an installed block type. Rename the component.`,
        { configKey }
      );
    }

    if (!type.isNone(component.props) && !type.isObject(component.props)) {
      throw new ConfigError(
        `Component "${component.id}" props should be an object mapping prop names to prop definitions.`,
        { received: component.props, configKey }
      );
    }
    validatePropDefinitions({ component, configKey });
    if (!type.isNone(component.slots) && !type.isArray(component.slots)) {
      throw new ConfigError(`Component "${component.id}" slots should be an array of names.`, {
        received: component.slots,
        configKey,
      });
    }
    if (type.isNone(component.blocks)) {
      throw new ConfigError(`Component "${component.id}" requires a blocks array.`, { configKey });
    }
    if (!type.isArray(component.blocks)) {
      throw new ConfigError(`Component "${component.id}" blocks should be an array.`, {
        received: component.blocks,
        configKey,
      });
    }

    context.componentDefs[component.id] = {
      id: component.id,
      props: component.props ?? {},
      slots: component.slots ?? [],
      blocks: component.blocks,
      configKey,
    };
  });

  return components;
}

export default buildComponents;
