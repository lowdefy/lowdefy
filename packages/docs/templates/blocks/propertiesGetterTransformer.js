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

function transformer(obj) {
  const blockProperties = obj.schema.properties.properties;
  const styleProperties = [];
  const optionsSelector = [];
  const manual = [];
  Object.keys(blockProperties).forEach((key) => {
    if (blockProperties[key].docs && blockProperties[key].docs.displayType === 'style') {
      styleProperties.push(key);
    }
    if (blockProperties[key].docs && blockProperties[key].docs.displayType === 'optionsSelector') {
      optionsSelector.push(key);
    }
    if (blockProperties[key].docs && blockProperties[key].docs.getter != null) {
      manual.push(key);
    }
  });
  const styleArray = styleProperties.map((name) => {
    const ret = {};
    ret[name] = {
      '_yaml.parse': {
        _if_none: [{ _state: `block.properties.${name}` }, ''],
      },
    };
    return ret;
  });
  const optionsArray = optionsSelector.map((name) => {
    const ret = {};
    ret[name] = {
      _if: {
        test: { _eq: [{ _state: '__optionsType' }, 'Primitive'] },
        then: {
          _get: {
            key: '0.options',
            from: {
              '_mql.aggregate': {
                pipeline: [{ $addFields: { options: '$options.primitive' } }],
                on: [{ _state: 'block.properties' }],
              },
            },
          },
        },
        else: {
          _state: 'block.properties.options',
        },
      },
    };
    return ret;
  });
  const manualArray = manual.map((name) => {
    const ret = {};
    ret[name] = blockProperties[name].docs.getter;
    return ret;
  });
  const assignArray = [{ _state: 'block.properties' }];
  return {
    '_object.assign': assignArray.concat(styleArray, optionsArray, manualArray),
  };
}

module.exports = transformer;
