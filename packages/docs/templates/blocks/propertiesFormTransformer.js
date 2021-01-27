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

const label = {
  id: 'label_card',
  type: 'Card',
  layout: {
    contentGutter: 0,
  },
  properties: {
    size: 'small',
    title: 'label:',
    inner: true,
  },
  blocks: [
    {
      id: 'block.properties.label.span',
      type: 'NumberInput',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'span',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Align label left or right when span is applied.',
        },
      },
    },
    {
      id: 'block.properties.label.align',
      type: 'ButtonSelector',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'align',
        size: 'small',
        options: ['left', 'right'],
        label: {
          span: 8,
          align: 'right',
          extra: 'Align label left or right when span is applied.',
        },
      },
    },
    {
      id: 'block.properties.label.inline',
      type: 'Switch',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'inline',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Align label left or right when span is applied.',
        },
      },
    },
    {
      id: 'block.properties.label.disabled',
      type: 'Switch',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'disabled',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Align label left or right when span is applied.',
        },
      },
    },
    {
      id: 'block.properties.label.colon',
      type: 'Switch',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'colon',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Align label left or right when span is applied.',
        },
      },
    },
    {
      id: 'block.properties.label.extra',
      type: 'TextInput',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'extra',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Align label left or right when span is applied.',
        },
      },
    },
  ],
};

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
      case 'label':
        return label;
      case 'optionsString':
        block.type = 'ControlledList';
        block.blocks = [
          {
            id: `block.properties.${propertyName}.$`,
            type: 'TextInput',
            properties: {
              size: 'small',
              label: {
                disabled: true,
              },
            },
          },
        ];
        return block;
      case 'optionsSelector':
        block.type = 'Box';
        block.blocks = [
          {
            id: '__optionsType',
            type: 'ButtonSelector',
            properties: {
              title: 'Options type',
              options: ['Primitive', 'Label-value pairs'],
              size: 'small',
              label: { span: 8, align: 'right' },
            },
          },
          {
            id: `block.properties.options`,
            type: 'ControlledList',
            properties: {
              title: 'options:',
              size: 'small',
            },
            blocks: [
              {
                id: `block.properties.options.$.primitive`,
                type: 'TextInput',
                visible: {
                  _if: {
                    test: { _eq: [{ _state: '__optionsType' }, 'Primitive'] },
                    then: true,
                    else: false,
                  },
                },
                properties: {
                  size: 'small',
                  label: {
                    disabled: true,
                  },
                },
              },
              {
                id: `block.properties.options.$.label`,
                type: 'TextInput',
                visible: {
                  _if: {
                    test: {
                      _eq: [{ _state: '__optionsType' }, 'Label-value pairs'],
                    },
                    then: true,
                    else: false,
                  },
                },
                properties: {
                  size: 'small',
                  title: 'label',
                  label: {
                    span: 8,
                    align: 'right',
                  },
                },
              },
              {
                id: `block.properties.options.$.value`,
                type: 'TextInput',
                visible: {
                  _if: {
                    test: {
                      _eq: [{ _state: '__optionsType' }, 'Label-value pairs'],
                    },
                    then: true,
                    else: false,
                  },
                },
                properties: {
                  size: 'small',
                  title: 'value',
                  label: {
                    span: 8,
                    align: 'right',
                  },
                },
              },
            ],
          },
        ];
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
  const blocks = Object.keys(blockProperties)
    .sort()
    .map((key) => {
      return makeBlockDefinition(key, blockProperties[key]);
    });
  return blocks;
}

module.exports = transformer;
