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

const oneOf = (propertyName, propertyDescription) => {
  const block = {
    id: propertyName,
    type: 'Card',
    layout: {
      contentGutter: 0,
    },
    bodyStyle: { padding: 0 },
    properties: {
      size: 'small',
      title: `${propertyName} - type options:`,
      inner: true,
      bodyStyle: { padding: 0 },
    },
  };
  block.areas = {
    extra: {
      blocks: [
        {
          id: `__${propertyName}_type`,
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
      blocks: propertyDescription.oneOf.map((item) => {
        const bl = makeBlockDefinition({
          propertyName: `__${propertyName}_${item.type}`,
          propertyDescription: item,
          requiredProperties: [],
          nameSpace: '',
        });
        bl.visible = {
          _if: {
            test: {
              _eq: [{ _state: `__${propertyName}_type` }, item.type],
            },
            then: true,
            else: false,
          },
        };
        bl.properties.title = bl.type === 'Card' ? `${propertyName}:` : propertyName;
        return bl;
      }),
    },
  };
  return block;
};

function makeBlockDefinition({ propertyName, propertyDescription, requiredProperties, nameSpace }) {
  let block = {
    id: `${nameSpace}${propertyName}`,
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
        block.type = 'TwitterColorSelector';
        return block;
      case 'style':
        block.type = 'TextArea';
        return block;
      case 'button':
        return button(propertyName);
      default:
        propertyDescription.type = propertyDescription.docs.displayType;
        break;
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
    case 'object':
      block = {
        id: block.id,
        type: 'Card',
        layout: {
          contentGutter: 0,
        },
        properties: {
          size: 'small',
          title: `${propertyName}:`,
          inner: true,
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
          bl.properties.title = objectPropertyName;
          return bl;
        });
      return block;
    case undefined:
      if (propertyDescription.oneOf) {
        return oneOf(propertyName, propertyDescription);
      }
      return block;
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
      return makeBlockDefinition({
        propertyName,
        propertyDescription: blockProperties[propertyName],
        requiredProperties,
        nameSpace: 'block.properties.',
      });
    });
  return blocks;
}

module.exports = transformer;

// case 'optionsString':
//   block.type = 'ControlledList';
//   block.blocks = [
//     {
//       id: `block.properties.${propertyName}.$`,
//       type: 'TextInput',
//       properties: {
//         size: 'small',
//         label: {
//           disabled: true,
//         },
//       },
//     },
//   ];
//   return block;
// case 'mediaSize':
//   block.type = 'Label';
//   block.properties = {
//     title: propertyName,
//     span: 8,
//     align: 'right',
//     extra: propertyDescription.description,
//   };
//   block.blocks = [
//     {
//       id: `__type_${propertyName}`,
//       layout: { span: 9 },
//       type: 'ButtonSelector',
//       properties: {
//         size: 'small',
//         options: ['number', 'object'],
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.number`,
//       layout: { span: 15 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'number'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.xs`,
//       layout: { span: 3 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'xs',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.sm`,
//       layout: { span: 3 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'sm',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.md`,
//       layout: { span: 3 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'md',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.lg`,
//       layout: { span: 3 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'lg',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.xl`,
//       layout: { span: 3 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'xl',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//   ];
//   return block;
// case 'minMaxSize':
//   block.type = 'Label';
//   block.properties = {
//     title: propertyName,
//     span: 8,
//     align: 'right',
//     extra: propertyDescription.description,
//   };
//   block.blocks = [
//     {
//       id: `__type_${propertyName}`,
//       layout: { span: 10 },
//       type: 'ButtonSelector',
//       properties: {
//         size: 'small',
//         options: ['boolean', 'object'],
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.boolean`,
//       layout: { span: 6 },
//       type: 'Switch',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'boolean'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.minRows`,
//       layout: { span: 6 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'minRows',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//     {
//       id: `block.properties.${propertyName}.maxRows`,
//       layout: { span: 6 },
//       type: 'NumberInput',
//       visible: {
//         _if: {
//           test: {
//             _eq: [{ _state: `__type_${propertyName}` }, 'object'],
//           },
//           then: true,
//           else: false,
//         },
//       },
//       properties: {
//         size: 'small',
//         placeholder: 'maxRows',
//         minimum: 1,
//         step: 1,
//         label: {
//           disabled: true,
//         },
//       },
//     },
//   ];
//   return block;
// case 'optionsSelector':
//   block.type = 'Card';
//   block.layout = {
//     contentGutter: 0,
//   };
//   block.properties = {
//     title: 'options:',
//     size: 'small',
//     inner: true,
//     bodyStyle: {
//       padding: 0,
//     },
//   };
//   block.areas = {
//     extra: {
//       blocks: [
//         {
//           id: '__optionsType',
//           type: 'ButtonSelector',
//           properties: {
//             options: ['Primitive', 'Label-value pairs'],
//             size: 'small',
//             label: { disabled: true },
//           },
//         },
//       ],
//     },
//     content: {
//       blocks: [
//         {
//           id: `block.properties.options`,
//           type: 'ControlledList',
//           properties: { size: 'small' },
//           blocks: [
//             {
//               id: `block.properties.options.$.primitive`,
//               type: 'TextInput',
//               visible: {
//                 _if: {
//                   test: { _eq: [{ _state: '__optionsType' }, 'Primitive'] },
//                   then: true,
//                   else: false,
//                 },
//               },
//               properties: {
//                 size: 'small',
//                 label: {
//                   disabled: true,
//                 },
//               },
//             },
//             {
//               id: `block.properties.options.$.label`,
//               type: 'TextInput',
//               visible: {
//                 _if: {
//                   test: {
//                     _eq: [{ _state: '__optionsType' }, 'Label-value pairs'],
//                   },
//                   then: true,
//                   else: false,
//                 },
//               },
//               properties: {
//                 size: 'small',
//                 title: 'label',
//                 label: {
//                   span: 8,
//                   align: 'right',
//                 },
//               },
//             },
//             {
//               id: `block.properties.options.$.value`,
//               type: 'TextInput',
//               visible: {
//                 _if: {
//                   test: {
//                     _eq: [{ _state: '__optionsType' }, 'Label-value pairs'],
//                   },
//                   then: true,
//                   else: false,
//                 },
//               },
//               properties: {
//                 size: 'small',
//                 title: 'value',
//                 label: {
//                   span: 8,
//                   align: 'right',
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     },
//   };
//   return block;
// case 'TextInput':
//   block.type = 'TextInput';
//   return block;
//   case 'disabledDates':
//     block.type = 'Card';
//     block.layout = {
//       contentGutter: 0,
//     };
//     block.properties = {
//       size: 'small',
//       title: 'disabledDates:',
//       inner: true,
//     };
//     block.blocks = [
//       {
//         id: 'block.properties.disabledDates.min',
//         type: 'DateSelector',
//         properties: {
//           size: 'small',
//           title: 'min',
//           label: {
//             span: 8,
//             align: 'right',
//           },
//         },
//       },
//       {
//         id: 'block.properties.disabledDates.max',
//         type: 'DateSelector',
//         properties: {
//           size: 'small',
//           title: 'max',
//           label: {
//             span: 8,
//             align: 'right',
//           },
//         },
//       },
//       {
//         id: 'block.properties.disabledDates.dates',
//         type: 'ControlledList',
//         properties: {
//           title: 'dates:',
//           size: 'small',
//         },
//         blocks: [
//           {
//             id: 'block.properties.disabledDates.dates.$',
//             type: 'DateSelector',
//             properties: {
//               size: 'small',
//               label: {
//                 disabled: true,
//               },
//             },
//           },
//         ],
//       },
//       {
//         id: 'block.properties.disabledDates.ranges',
//         type: 'ControlledList',
//         properties: {
//           title: 'ranges:',
//           size: 'small',
//         },
//         blocks: [
//           {
//             id: 'block.properties.disabledDates.ranges.$',
//             type: 'DateRangeSelector',
//             properties: {
//               size: 'small',
//               label: {
//                 disabled: true,
//               },
//             },
//           },
//         ],
//       },
//     ];
// }
