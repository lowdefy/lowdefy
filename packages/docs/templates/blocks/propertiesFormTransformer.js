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

function makeBlockDefinition(propertyName, propertyDescription) {
  const block = {
    id: `block.properties.${propertyName}`,
    layout: { _global: 'settings_input_layout' },
    properties: {
      title: propertyName,
      size: 'small',
      label: {
        span: 8,
        align: 'right',
        extra: propertyDescription.description,
      },
    },
  };

  if (
    propertyDescription.docs &&
    propertyDescription.docs.label &&
    propertyDescription.docs.label.span
  ) {
    block.properties.label.span = propertyDescription.docs.label.span;
  }
  if (propertyDescription.docs && propertyDescription.docs.displayType) {
    switch (propertyDescription.docs.displayType) {
      case 'manual':
        return propertyDescription.docs.manual;
      case 'icon':
        block.type = 'Selector';
        block.layout = { _global: 'settings_input_layout' };
        block.properties = {
          ...block.properties,
          showSearch: true,
          allowClear: true,
          options: { _global: 'all_icons' },
        };
        return block;
      case 'color':
        block.type = 'TwitterColorSelector';
        return block;
      case 'style':
        block.type = 'TextArea';
        return block;
    }
  }

  // enums
  if (propertyDescription.enum) {
    block.type = 'ButtonSelector';
    block.properties.options = propertyDescription.enum;
    return block;
  }

  // defaults for type
  switch (propertyDescription.type) {
    case 'boolean':
      block.type = 'Switch';
      return block;
    case 'string':
      block.type = 'TextInput';
      return block;
    case 'number':
      block.type = 'NumberInput';
      return block;
    default:
      return block;
  }
}

function transformer(obj) {
  const blockProperties = obj.schema.properties.properties;
  const blocks = Object.keys(blockProperties).map((key) => {
    return makeBlockDefinition(key, blockProperties[key]);
  });
  return blocks;
}

module.exports = transformer;
