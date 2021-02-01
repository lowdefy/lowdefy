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

const button = (propertyName) => ({
  id: 'button_card',
  type: 'Card',
  layout: {
    contentGutter: 0,
  },
  properties: {
    size: 'small',
    title: 'button:',
    inner: true,
  },
  blocks: [
    {
      id: `block.properties.${propertyName}.icon`,
      type: 'Selector',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'icon',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Name of an Ant Design Icon or properties of an Icon block to use icon in button.',
        },
        showSearch: true,
        allowClear: true,
        options: { _global: 'all_icons' },
      },
    },
    {
      id: `block.properties.${propertyName}.title`,
      type: 'TextInput',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'title',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Title text on the button.',
        },
      },
    },
    {
      id: `block.properties.${propertyName}.type`,
      type: 'ButtonSelector',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'type',
        size: 'small',
        options: ['primary', 'default', 'dashed', 'danger', 'link', 'text'],
        label: {
          span: 8,
          align: 'right',
          extra: 'The button type.',
        },
      },
    },
  ],
});

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

function makeBlockDefinition(propertyName, propertyDescription, requiredProperties) {
  const block = {
    id: `block.properties.${propertyName}`,
    layout: { _global: 'settings_input_layout' },
    required: requiredProperties.includes(propertyName),
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
        return propertyDescription.docs.block;
      case 'icon':
        block.type = 'Selector';
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
      case 'button':
        return button(propertyName);
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
      case 'minMaxSize':
        block.type = 'Label';
        block.properties = {
          title: propertyName,
          span: 8,
          align: 'right',
          extra: propertyDescription.description,
        };
        block.blocks = [
          {
            id: `__type_${propertyName}`,
            layout: { span: 10 },
            type: 'ButtonSelector',
            properties: {
              size: 'small',
              options: ['boolean', 'object'],
              label: {
                disabled: true,
              },
            },
          },
          {
            id: `block.properties.${propertyName}.boolean`,
            layout: { span: 6 },
            type: 'Switch',
            visible: {
              _if: {
                test: {
                  _eq: [{ _state: `__type_${propertyName}` }, 'boolean'],
                },
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
            id: `block.properties.${propertyName}.minRows`,
            layout: { span: 6 },
            type: 'NumberInput',
            visible: {
              _if: {
                test: {
                  _eq: [{ _state: `__type_${propertyName}` }, 'object'],
                },
                then: true,
                else: false,
              },
            },
            properties: {
              size: 'small',
              placeholder: 'minRows',
              minimum: 1,
              step: 1,
              label: {
                disabled: true,
              },
            },
          },
          {
            id: `block.properties.${propertyName}.maxRows`,
            layout: { span: 6 },
            type: 'NumberInput',
            visible: {
              _if: {
                test: {
                  _eq: [{ _state: `__type_${propertyName}` }, 'object'],
                },
                then: true,
                else: false,
              },
            },
            properties: {
              size: 'small',
              placeholder: 'maxRows',
              minimum: 1,
              step: 1,
              label: {
                disabled: true,
              },
            },
          },
        ];
        return block;
      case 'optionsSelector':
        block.type = 'Card';
        block.layout = {
          contentGutter: 0,
        };
        block.properties = {
          title: 'options:',
          size: 'small',
          inner: true,
          bodyStyle: {
            padding: 0,
          },
        };
        block.areas = {
          extra: {
            blocks: [
              {
                id: '__optionsType',
                type: 'ButtonSelector',
                properties: {
                  options: ['Primitive', 'Label-value pairs'],
                  size: 'small',
                  label: { disabled: true },
                },
              },
            ],
          },
          content: {
            blocks: [
              {
                id: `block.properties.options`,
                type: 'ControlledList',
                properties: { size: 'small' },
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
            ],
          },
        };
        return block;
      case 'TextInput':
        block.type = 'TextInput';
        return block;
      case 'disabledDates':
        block.type = 'Card';
        block.layout = {
          contentGutter: 0,
        };
        block.properties = {
          size: 'small',
          title: 'disabledDates:',
          inner: true,
        };
        block.blocks = [
          {
            id: 'block.properties.disabledDates.min',
            type: 'DateSelector',
            properties: {
              size: 'small',
              title: 'min',
              label: {
                span: 8,
                align: 'right',
              },
            },
          },
          {
            id: 'block.properties.disabledDates.max',
            type: 'DateSelector',
            properties: {
              size: 'small',
              title: 'max',
              label: {
                span: 8,
                align: 'right',
              },
            },
          },
          {
            id: 'block.properties.disabledDates.dates',
            type: 'ControlledList',
            properties: {
              title: 'dates:',
              size: 'small',
            },
            blocks: [
              {
                id: 'block.properties.disabledDates.dates.$',
                type: 'DateSelector',
                properties: {
                  size: 'small',
                  label: {
                    disabled: true,
                  },
                },
              },
            ],
          },
          {
            id: 'block.properties.disabledDates.ranges',
            type: 'ControlledList',
            properties: {
              title: 'ranges:',
              size: 'small',
            },
            blocks: [
              {
                id: 'block.properties.disabledDates.ranges.$',
                type: 'DateRangeSelector',
                properties: {
                  size: 'small',
                  label: {
                    disabled: true,
                  },
                },
              },
            ],
          },
        ];
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
      block.properties.step = propertyDescription.step ? propertyDescription.step : 0.1;
      if (propertyDescription.maximum != null) {
        block.properties.max = propertyDescription.maximum;
      }
      if (propertyDescription.minimum != null) {
        block.properties.min = propertyDescription.minimum;
      }
      return block;
    case 'integer':
      block.type = 'NumberInput';
      block.properties.step = propertyDescription.step ? propertyDescription.step : 1;
      if (propertyDescription.maximum != null) {
        block.properties.max = propertyDescription.maximum;
      }
      if (propertyDescription.minimum != null) {
        block.properties.min = propertyDescription.minimum;
      }
      return block;
    case undefined:
      if (propertyDescription.oneOf) {
        block.type = 'Card';
        block.layout = {
          contentGutter: 0,
        };
        block.properties = { size: 'small', title: `${propertyName} - type options:`, inner: true };
        block.areas = {
          extra: {
            blocks: [
              {
                id: `__type_select_${propertyName}`,
                type: 'ButtonSelector',
                properties: {
                  options: propertyDescription.oneOf.map((item) => item.type),
                  size: 'small',
                  label: {
                    disabled: true,
                  },
                },
              },
            ],
          },
          content: {
            blocks: [
              ...[].concat(
                ...propertyDescription.oneOf.map((item) => {
                  let bl;
                  if (item.type === 'object') {
                    return Object.keys(item.properties).map((objectPropertyName) => {
                      bl = makeBlockDefinition(
                        `${propertyName}.${objectPropertyName}`,
                        item.properties[objectPropertyName],
                        []
                      );
                      bl.properties.title = objectPropertyName;
                      bl.visible = {
                        _if: {
                          test: {
                            _eq: [{ _state: `__type_select_${propertyName}` }, item.type],
                          },
                          then: true,
                          else: false,
                        },
                      };
                      return bl;
                    });
                  }
                  bl = makeBlockDefinition(`${propertyName}.__${item.type}`, item, []);
                  bl.visible = {
                    _if: {
                      test: {
                        _eq: [{ _state: `__type_select_${propertyName}` }, item.type],
                      },
                      then: true,
                      else: false,
                    },
                  };
                  bl.properties.title = propertyName;
                  return [bl];
                })
              ),
            ],
          },
        };
        return block;
      }
    default:
      return block;
  }
}

function transformer(obj) {
  const blockProperties = obj.schema.properties.properties;
  const requiredProperties = obj.schema.properties.required || [];
  const blocks = Object.keys(blockProperties)
    .sort()
    .map((propertyName) => {
      return makeBlockDefinition(propertyName, blockProperties[propertyName], requiredProperties);
    });
  return blocks;
}

module.exports = transformer;
