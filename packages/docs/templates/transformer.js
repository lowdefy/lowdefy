// const schema = require('./Button.json');

function makeBlockDefinition(propertyName, propertyDescription) {
  const block = {
    id: `block.properties.${propertyName}`,
    layout: { _global: 'settings_input_layout' },
    properties: {
      title: propertyName,
      size: 'small',
      label: {
        _ref: {
          path: 'templates/blocks/label_extra.yaml',
          vars: {
            extra: propertyDescription.description,
          },
        },
      },
    },
  };

  if (propertyDescription.docs && propertyDescription.docs.displayType) {
    switch (propertyDescription.docs.displayType) {
      case 'manual':
        return propertyDescription.docs.manual;
      case 'icon':
        return {
          _ref: {
            path: 'templates/blocks/icon_template.yaml.njk',
            vars: {
              icon_field_name: propertyName,
              icon_description: propertyDescription.description,
            },
          },
        };
      case 'color':
        block.type = 'TwitterColorSelector';
        return block;
      case 'style':
        // TODO:
        block.type = 'TextInput';
        return block;
    }
  }

  // enums
  if (propertyDescription.enum) {
    block.type = 'ButtonSelector';
    block.options = propertyDescription.enum;
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

// transformer(schema);

module.exports = transformer;
