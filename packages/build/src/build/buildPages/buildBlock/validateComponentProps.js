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

import { getOperatorType, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import findSimilarString from '../../../utils/findSimilarString.js';

// Validates a component instance's props against the component's declared prop
// surface, in the module-var style (registerModules): required props must be
// supplied, unknown props are rejected, and a typed prop with a literal value
// is type-checked. An operator-valued prop is accepted — its runtime type is
// unknown at build, the same way a typed block property accepts an operator.
function validateComponentProps({ def, useProps, instanceId, configKey }) {
  const declared = def.props ?? {};
  const declaredNames = Object.keys(declared);

  // Unknown props supplied at the use site.
  for (const name of Object.keys(useProps)) {
    if (name.startsWith('~')) continue;
    if (!Object.hasOwn(declared, name)) {
      const nearest = findSimilarString({ input: name, candidates: declaredNames });
      const suffix =
        nearest !== null
          ? ` Did you mean "${nearest}"?`
          : declaredNames.length > 0
            ? ` Declared props: ${declaredNames.join(', ')}.`
            : '';
      throw new ConfigError(
        `Component "${def.id}" used at "${instanceId}" has no prop "${name}".${suffix}`,
        { configKey, checkSlug: 'component' }
      );
    }
  }

  for (const [name, propDef] of Object.entries(declared)) {
    if (!type.isObject(propDef)) continue;
    const value = useProps[name];
    const supplied = !type.isUndefined(value);

    // Required prop with no default must be supplied. Unlike a missing _var
    // (which resolves to null), a missing required prop is a build error.
    if (propDef.required === true && type.isUndefined(propDef.default) && type.isNone(value)) {
      throw new ConfigError(
        `Component "${def.id}" used at "${instanceId}" requires prop "${name}"` +
          (propDef.description ? `\n  - ${propDef.description}` : '') +
          '.',
        { configKey, checkSlug: 'component' }
      );
    }

    // Type-check a supplied literal against the declared type. Operator-valued
    // props are pruned (accepted) — their output type is unknown at build.
    // 'integer' narrows 'number' (type.typeOf has no integer kind), used by
    // archetype props such as ListPage pageSize.
    const matchesType =
      propDef.type === 'integer' ? type.isInt(value) : type.typeOf(value) === propDef.type;
    if (
      supplied &&
      type.isString(propDef.type) &&
      getOperatorType(value) === null &&
      !type.isNone(value) &&
      !matchesType
    ) {
      throw new ConfigError(
        `Component "${def.id}" used at "${instanceId}" prop "${name}" should be type "${
          propDef.type
        }" but received "${type.typeOf(value)}".`,
        { received: value, configKey, checkSlug: 'component' }
      );
    }
  }
}

export default validateComponentProps;
