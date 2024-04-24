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

const avatar = (path) => ({
  id: `${path}_avatar_card`,
  type: 'Card',
  layout: {
    contentGutter: 0,
  },
  properties: {
    size: 'small',
    title: 'avatar:',
    inner: true,
  },
  blocks: [
    {
      id: `${path}.color`,
      type: 'ColorSelector',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'color',
        size: 'small',
        showValue: true,
        label: {
          span: 8,
          align: 'right',
          extra: 'The background color of the avatar. Should be a hex color string.',
        },
      },
    },
    {
      id: `${path}.content`,
      type: 'TextInput',
      layout: {
        _global: 'settings_input_layout',
      },
      properties: {
        title: 'content',
        size: 'small',
        label: {
          span: 8,
          align: 'right',
          extra: 'Text to display inside avatar.',
        },
      },
    },
  ],
});

const button = (path) => ({
  id: `${path}_button_card`,
  type: 'Card',
  layout: {
    contentGutter: 0,
  },
  properties: {
    size: 'small',
    title: `${path}:`,
    inner: true,
  },
  blocks: [
    {
      id: `${path}.icon`,
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
          extra:
            'Name of an React-Icon (See <a href="https://react-icons.github.io/react-icons/">all icons</a>) or properties of an Icon block to use icon in button.',
        },
        showSearch: true,
        allowClear: true,
        options: { _global: 'all_icons' },
      },
    },
    {
      id: `${path}.title`,
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
      id: `${path}.type`,
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

const oneOf = ({ propertyName, propertyDescription, nameSpace }) => {
  const block = {
    id: propertyName,
    type: 'Card',
    layout: {
      contentGutter: 0,
    },
    properties: {
      size: 'small',
      title: `Select ${propertyName} type`,
      inner: true,
      bodyStyle: { padding: 0 },
      headerStyle: { color: 'rgba(0, 0, 0, 0.45)', background: 'rgba(0, 0, 0, 0.06)' },
    },
  };
  block.areas = {
    extra: {
      blocks: [
        {
          id: `__type_${nameSpace}${propertyName}`,
          type: 'ButtonSelector',
          properties: {
            options: propertyDescription.oneOf.map((item) =>
              item.type === 'array' ? `${item.items.type}[]` : item.type
            ),
            size: 'small',
            color: 'rgba(0, 0, 0, 0.1)',
            buttonStyle: 'outlined',
            label: {
              disabled: true,
            },
          },
        },
      ],
    },
    content: {
      blocks: propertyDescription.oneOf.map((item) => {
        const bl = makeBlockDefinition({
          propertyName: propertyName,
          propertyDescription: item,
          requiredProperties: [],
          nameSpace: `__${
            item.type === 'array' ? `${item.items.type}_arr` : item.type
          }_${nameSpace}`,
        });
        bl.visible = {
          _if: {
            test: {
              _eq: [
                { _state: `__type_${nameSpace}${propertyName}` },
                item.type === 'array' ? `${item.items.type}[]` : item.type,
              ],
            },
            then: true,
            else: false,
          },
        };
        return bl;
      }),
    },
  };
  return block;
};

function makeBlockDefinition({
  propertyName,
  propertyDescription,
  requiredProperties,
  nameSpace,
  labelDisabled,
}) {
  let block = {
    id: `${nameSpace}${propertyName}`,
    layout: { _global: 'settings_input_layout' },
    required: requiredProperties.includes(propertyName),
    properties: {
      title: propertyName,
      size: 'small',
      label: labelDisabled
        ? { disabled: true }
        : {
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

  // displayType
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
        block.type = 'ColorSelector';
        block.properties.showValue = true;
        block.properties.size = 'small';
        return block;
      case 'date':
        block.type = 'DateSelector';
        return block;
      case 'dateRange':
        block.type = 'DateRangeSelector';
        return block;
      case 'yaml':
        block.type = 'TextArea';
        block.properties.placeholder = 'Type YAML here';
        block.properties.autoSize = { minRows: 2 };
        return block;
      case 'text-area':
        block.type = 'TextArea';
        return block;
      case 'button':
        return button(`${nameSpace}${propertyName}`);
      case 'avatar':
        return avatar(`${nameSpace}${propertyName}`);
      default:
        propertyDescription.type = propertyDescription.docs.displayType;
        break;
    }
  }

  // enums
  if (propertyDescription.enum) {
    block.type = 'ButtonSelector';
    if (propertyDescription.enum.length >= 5) {
      block.type = 'Selector';
    }
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
    case 'object':
      block = {
        id: `${nameSpace}${propertyName}`,
        type: 'Card',
        layout: {
          contentGutter: 0,
        },
        properties: {
          size: 'small',
          title: !labelDisabled ? `${propertyName}:` : undefined,
          bodyStyle: { padding: 0 },
        },
      };
      block.blocks = Object.keys(propertyDescription.properties)
        .sort()
        .map((objectPropertyName) => {
          const bl = makeBlockDefinition({
            propertyName: objectPropertyName,
            propertyDescription: propertyDescription.properties[objectPropertyName],
            requiredProperties: propertyDescription.required || [],
            nameSpace: `${nameSpace}${propertyName}.`,
          });
          return bl;
        });
      return block;
    case 'array':
      block = {
        id: `${nameSpace}${propertyName}`,
        type: 'ControlledList',
        layout: {
          contentGutter: 0,
        },
        properties: {
          size: 'small',
          title: !labelDisabled ? `${propertyName}:` : undefined,
          itemStyle: { padding: 0 },
        },
      };
      block.blocks = [
        makeBlockDefinition({
          propertyName: `$`,
          propertyDescription: propertyDescription.items,
          requiredProperties: [],
          nameSpace: `${nameSpace}${propertyName}.`,
          labelDisabled: true,
        }),
      ];
      return block;
    case undefined:
      if (propertyDescription.oneOf) {
        return oneOf({ propertyName, propertyDescription, nameSpace });
      }
      return block;
    default:
      return block;
  }
}

function transformer(obj) {
  const blockProperties = obj.properties.properties;
  const requiredProperties = obj.properties.required || [];
  const blocks = Object.keys(blockProperties)
    .sort()
    .map((propertyName) => {
      return makeBlockDefinition({
        propertyName,
        propertyDescription: blockProperties[propertyName],
        requiredProperties,
        nameSpace: 'block.properties.',
      });
    });
  return blocks;
}

export default transformer;
