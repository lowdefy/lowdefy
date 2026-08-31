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
import { ConfigError } from '@lowdefy/errors';

import addKeys from './addKeys.js';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateId from '../utils/validateId.js';

// Reads the top-level components: list, validates each component definition and
// registers it in context.componentDefs, keyed by its type name (its id). The
// list is discovered the way pages: are — a _ref list resolved by buildRefs —
// so component files behave identically to page files for provenance and vars.
function buildComponents({ components, context }) {
  const componentList = components.components ?? [];
  delete components.components;

  if (!type.isArray(componentList)) {
    throw new ConfigError('App "components" should be an array.', {
      received: componentList,
    });
  }

  // buildComponents runs before the build's first addKeys pass (the defs are
  // extracted so _prop/_slot markers never reach precompute), so key the
  // extracted list here — the same pre-keying buildMigrations does — so that
  // validation errors below and expansion-time errors inside component bodies
  // resolve to the component file instead of having no location.
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
    if (!type.isNone(context.blockMetas?.[component.id])) {
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
