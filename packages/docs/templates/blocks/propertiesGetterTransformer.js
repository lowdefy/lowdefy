/*
  Copyright 2020-2021 Lowdefy, Inc

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

// function transformer(obj) {
//   const blockProperties = obj.schema.properties.properties;
//   const styleProperties = [];
//   const optionsSelector = [];
//   const manual = [];
//   const oneOf = [];
//   Object.keys(blockProperties).forEach((key) => {
//     if (blockProperties[key].docs && blockProperties[key].docs.displayType === 'style') {
//       styleProperties.push(key);
//     }
//     if (blockProperties[key].oneOf != null) {
//       oneOf.push(key);
//     }
//     if (blockProperties[key].docs && blockProperties[key].docs.displayType === 'optionsSelector') {
//       optionsSelector.push(key);
//     }
//     if (blockProperties[key].docs && blockProperties[key].docs.getter != null) {
//       manual.push(key);
//     }
//   });
//   const styleArray = styleProperties.map((name) => {
//     const ret = {};
//     ret[name] = {
//       '_yaml.parse': {
//         _if_none: [{ _state: `block.properties.${name}` }, ''],
//       },
//     };
//     return ret;
//   });
//   const oneOfArray = oneOf.map((name) => {
//     const ret = {};
//     ret[name] = {
//       _state: {
//         '_string.concat': [`__${name}_`, { _state: `__${name}_type` }],
//       },
//     };
//     return ret;
//   });
//   const optionsArray = optionsSelector.map((name) => {
//     const ret = {};
//     ret[name] = {
//       _if: {
//         test: { _eq: [{ _state: '__optionsType' }, 'Primitive'] },
//         then: {
//           _get: {
//             key: '0.options',
//             from: {
//               '_mql.aggregate': {
//                 pipeline: [{ $addFields: { options: '$options.primitive' } }],
//                 on: [{ _state: 'block.properties' }],
//               },
//             },
//           },
//         },
//         else: {
//           _state: 'block.properties.options',
//         },
//       },
//     };
//     return ret;
//   });
//   const manualArray = manual.map((name) => {
//     const ret = {};
//     ret[name] = blockProperties[name].docs.getter;
//     return ret;
//   });
//   const assignArray = [{ _state: 'block.properties' }];
//   return {
//     '_object.assign': assignArray.concat(styleArray, oneOfArray, optionsArray, manualArray),
//   };
// }

const arrayGetter = ({ data, items, path, underscores }) => {
  const getter = propertyGetter({
    data: 'args',
    path: '0',
    property: items,
    underscores: underscores + '_',
  });
  if (getter) {
    return {
      [`${underscores}array.map`]: {
        on: { [`${underscores}if_none`]: [{ [`${underscores}${data}`]: path }, []] },
        callback: {
          [`${underscores}function`]: getter,
        },
      },
    };
  }
};

const propertyGetter = ({ data, path, property, underscores }) => {
  if (property.docs && property.docs.displayType === 'yaml') {
    return {
      [`${underscores}yaml.parse`]: {
        [`${underscores}if_none`]: [{ [`${underscores}${data}`]: path }, ''],
      },
    };
  }
  if (property.docs && property.docs.displayType === 'manual' && property.docs.getter != null) {
    return property.docs.getter;
  }
  if (property.type === 'object' && property.properties) {
    return objectGetter({
      data,
      path,
      properties: property.properties,
      underscores,
    });
  }
  if (property.type === 'array' && property.items) {
    return arrayGetter({ data, items: property.items, path, underscores });
  }
};

const objectGetter = ({ data, path, properties, underscores }) => {
  const getters = [];
  Object.keys(properties).forEach((key) => {
    const getter = propertyGetter({
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
    [`${underscores}object.assign`]: [{ [`${underscores}${data}`]: path }].concat(getters),
  };
};

const transformer = (obj) => {
  const x = objectGetter({
    data: 'state',
    path: 'block.properties',
    properties: obj.schema.properties.properties,
    underscores: '_',
  });
  // console.log(JSON.stringify(x, null, 2));
  return x;
};

module.exports = transformer;
