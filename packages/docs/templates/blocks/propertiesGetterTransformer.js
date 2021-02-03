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

const propertyGetter = ({ property, nameSpace, propertyName, getters }) => {
  if (property.docs && property.docs.displayType === 'yaml') {
    getters.push({
      [propertyName]: {
        '_yaml.parse': {
          _if_none: [{ _state: `${nameSpace}.${propertyName}` }, ''],
        },
      },
    });
  } else if (
    property.docs &&
    property.docs.displayType === 'manual' &&
    property.docs.getter != null
  ) {
    getters.push({ [propertyName]: property.docs.getter });
  } else if (property.type === 'object' && property.properties) {
    getters.push({
      [propertyName]: makeGetters({
        properties: property.properties,
        nameSpace: `${nameSpace}.${propertyName}`,
      }),
    });
  } else if (property.type === 'object') {
    // for display types like button, where all properties are not specified in the schema
    getters.push({
      [propertyName]: { _state: `${nameSpace}.${propertyName}` },
    });
  }
};

const makeGetters = ({ properties, nameSpace }) => {
  const assignArray = [{ _state: nameSpace }];
  const getters = [];
  Object.keys(properties).forEach((key) => {
    // if (properties[key].type === 'array') {
    //   propertyGetter({
    //     property: properties[key].items,
    //     nameSpace,
    //     propertyName: `${key}.$`,
    //     getters,
    //   });
    // } else {
    propertyGetter({ property: properties[key], nameSpace, propertyName: key, getters });
    // }
  });
  return {
    '_object.assign': assignArray.concat(getters),
  };
};

const transformer = (obj) => {
  return makeGetters({
    properties: obj.schema.properties.properties,
    nameSpace: 'block.properties',
  });
};

module.exports = transformer;
