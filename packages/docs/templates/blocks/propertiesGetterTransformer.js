/*
  Copyright 2020-2024 Lowdefy, Inc

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

const oneOfGetter = ({ contextId, options, path, underscores }) => {
  const types = options.map((option) => {
    if (option.type === 'array') {
      return { data: `${option.items.type}_arr`, selector: `${option.items.type}[]` };
    }
    return { data: option.type, selector: option.type };
  });
  const branches = types.map((type, index) => {
    const getter = propertyGetter({
      contextId,
      data: 'state',
      path: `__${type.data}_${path}`,
      property: options[index],
      underscores: underscores,
    });
    return {
      case: { _eq: [{ _state: `__type_${path}` }, type.selector] },
      then: getter || { _state: { key: `__${type.data}_${path}`, contextId } },
    };
  });
  return {
    '_mql.expr': {
      on: {},
      expr: {
        $switch: {
          branches,
          default: null,
        },
      },
    },
  };
};

const arrayGetter = ({ contextId, data, items, path, underscores }) => {
  const getter = propertyGetter({
    contextId: undefined, // Cannot use contextId with _args
    data: 'args',
    path: '0',
    property: items,
    underscores: underscores + '_',
  });
  if (getter) {
    return {
      [`${underscores}array.map`]: {
        on: {
          [`${underscores}if_none`]: [{ [`${underscores}${data}`]: { key: path, contextId } }, []],
        },
        callback: {
          [`${underscores}function`]: getter,
        },
      },
    };
  }
};

const propertyGetter = ({ contextId, data, path, property, underscores }) => {
  if (property.docs && property.docs.displayType === 'yaml') {
    return {
      [`${underscores}yaml.parse`]: [
        {
          [`${underscores}if_none`]: [{ [`${underscores}${data}`]: { key: path, contextId } }, ''],
        },
      ],
    };
  }
  if (property.docs && property.docs.displayType === 'manual' && property.docs.getter != null) {
    return property.docs.getter;
  }
  if (property.type === 'object' && property.properties) {
    return objectGetter({
      contextId,
      data,
      path,
      properties: property.properties,
      underscores,
    });
  }
  if (property.type === 'array' && property.items) {
    return arrayGetter({ contextId, data, items: property.items, path, underscores });
  }
  if (property.oneOf) {
    return oneOfGetter({ contextId, data, options: property.oneOf, path, underscores });
  }
};

const objectGetter = ({ contextId, data, path, properties, underscores }) => {
  const getters = [];
  Object.keys(properties).forEach((key) => {
    const getter = propertyGetter({
      contextId,
      data,
      path: `${path}.${key}`,
      property: properties[key],
      underscores,
    });
    if (getter) {
      getters.push({ [key]: getter });
    }
  });
  return {
    [`${underscores}object.assign`]: [
      { [`${underscores}${data}`]: { key: path, contextId, default: {} } },
    ].concat(getters),
  };
};

const transformer = (obj, vars) => {
  const contextId = `${vars.block_type}:${vars.block_type}:{}`;
  return objectGetter({
    contextId,
    data: 'state',
    path: 'block.properties',
    properties: obj.properties.properties,
    underscores: '_',
  });
};

export default transformer;
