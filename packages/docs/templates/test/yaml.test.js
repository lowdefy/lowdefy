/*
  Copyright 2020-2026 Lowdefy, Inc

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

import propertiesFormTransformer from '../blocks/propertiesFormTransformer.js';
import propertiesGetterTransformer from '../blocks/propertiesGetterTransformer.js';
import defaultValueTransformer from '../blocks/defaultValueTransformer.js';
import { expect, test } from 'vitest';

const schema = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      field: {
        type: 'object',
        description: 'description',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
};

test('yaml propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schema)).toMatchInlineSnapshot(`
    [
      {
        "id": "block.properties.field",
        "layout": {
          "_global": "settings_input_layout",
        },
        "properties": {
          "autoSize": {
            "minRows": 2,
          },
          "label": {
            "align": "right",
            "extra": "description",
            "span": 8,
          },
          "placeholder": "Type YAML here",
          "size": "small",
          "title": "field",
        },
        "required": false,
        "type": "TextArea",
      },
    ]
  `);
});

test('yaml propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schema, { block_type: 'Block' })).toMatchInlineSnapshot(`
    {
      "_object.assign": [
        {
          "_state": {
            "contextId": "Block:Block:{}",
            "default": {},
            "key": "block.properties",
          },
        },
        {
          "field": {
            "_yaml.parse": [
              {
                "_if_none": [
                  {
                    "_state": {
                      "contextId": "Block:Block:{}",
                      "key": "block.properties.field",
                    },
                  },
                  "",
                ],
              },
            ],
          },
        },
      ],
    }
  `);
});

test('yaml defaultValueTransformer', () => {
  expect(defaultValueTransformer(schema)).toMatchInlineSnapshot(`
    {
      "field": "",
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        field: {
          type: 'object',
          default: 'value',
          description: 'description',
          docs: {
            displayType: 'yaml',
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "field": "value",
    }
  `);
});

const schemaNested = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      obj: {
        type: 'object',
        description: 'obj description',
        properties: {
          field: {
            type: 'object',
            description: 'field description',
            docs: {
              displayType: 'yaml',
            },
          },
        },
      },
    },
  },
};

test('yaml schemaNested propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaNested)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "block.properties.obj.field",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "autoSize": {
                "minRows": 2,
              },
              "label": {
                "align": "right",
                "extra": "field description",
                "span": 8,
              },
              "placeholder": "Type YAML here",
              "size": "small",
              "title": "field",
            },
            "required": false,
            "type": "TextArea",
          },
        ],
        "id": "block.properties.obj",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "bodyStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "obj:",
        },
        "type": "Card",
      },
    ]
  `);
});

test('yaml schemaNested propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaNested, { block_type: 'Block' })).toMatchInlineSnapshot(`
    {
      "_object.assign": [
        {
          "_state": {
            "contextId": "Block:Block:{}",
            "default": {},
            "key": "block.properties",
          },
        },
        {
          "obj": {
            "_object.assign": [
              {
                "_state": {
                  "contextId": "Block:Block:{}",
                  "default": {},
                  "key": "block.properties.obj",
                },
              },
              {
                "field": {
                  "_yaml.parse": [
                    {
                      "_if_none": [
                        {
                          "_state": {
                            "contextId": "Block:Block:{}",
                            "key": "block.properties.obj.field",
                          },
                        },
                        "",
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
  `);
});

test('yaml schemaNested defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaNested)).toMatchInlineSnapshot(`
    {
      "obj": {
        "field": "",
      },
    }
  `);
  const schemaDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        obj: {
          type: 'object',
          description: 'obj description',
          properties: {
            field: {
              type: 'object',
              default: { a: 1 },
              description: 'field description',
              docs: {
                displayType: 'yaml',
              },
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaDV)).toMatchInlineSnapshot(`
    {
      "obj": {
        "field": {
          "a": 1,
        },
      },
    }
  `);
});

const schemaYamlInArray = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      arr: {
        type: 'array',
        description: 'arr description',
        items: {
          type: 'object',
          description: 'yaml description',
          docs: {
            displayType: 'yaml',
          },
        },
      },
    },
  },
};

test('yaml schemaYamlInArray propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaYamlInArray)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "id": "block.properties.arr.$",
            "layout": {
              "_global": "settings_input_layout",
            },
            "properties": {
              "autoSize": {
                "minRows": 2,
              },
              "label": {
                "disabled": true,
              },
              "placeholder": "Type YAML here",
              "size": "small",
              "title": "$",
            },
            "required": false,
            "type": "TextArea",
          },
        ],
        "id": "block.properties.arr",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "itemStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "arr:",
        },
        "type": "ControlledList",
      },
    ]
  `);
});

test('yaml schemaYamlInArray propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaYamlInArray, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
      {
        "_object.assign": [
          {
            "_state": {
              "contextId": "Block:Block:{}",
              "default": {},
              "key": "block.properties",
            },
          },
          {
            "arr": {
              "_array.map": {
                "callback": {
                  "_function": {
                    "__yaml.parse": [
                      {
                        "__if_none": [
                          {
                            "__args": {
                              "contextId": undefined,
                              "key": "0",
                            },
                          },
                          "",
                        ],
                      },
                    ],
                  },
                },
                "on": {
                  "_if_none": [
                    {
                      "_state": {
                        "contextId": "Block:Block:{}",
                        "key": "block.properties.arr",
                      },
                    },
                    [],
                  ],
                },
              },
            },
          },
        ],
      }
    `);
});

test('yaml schemaYamlInArray defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaYamlInArray)).toMatchInlineSnapshot(`
    {
      "arr": [],
    }
  `);
  const schemaYamlInArrayDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        arr: {
          type: 'array',
          default: [{ a: 1 }],
          description: 'arr description',
          items: {
            type: 'object',
            description: 'yaml description',
            docs: {
              displayType: 'yaml',
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaYamlInArrayDV)).toMatchInlineSnapshot(`
    {
      "arr": [
        {
          "a": 1,
        },
      ],
    }
  `);
});

const schemaYamlInObjectInArray = {
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      arr: {
        type: 'array',
        description: 'arr description',
        items: {
          type: 'object',
          description: 'obj description',
          properties: {
            yaml: {
              type: 'object',
              description: 'yaml description',
              docs: {
                displayType: 'yaml',
              },
            },
          },
        },
      },
    },
  },
};

test('yaml schemaYamlInObjectInArray propertiesFormTransformer', () => {
  expect(propertiesFormTransformer(schemaYamlInObjectInArray)).toMatchInlineSnapshot(`
    [
      {
        "blocks": [
          {
            "blocks": [
              {
                "id": "block.properties.arr.$.yaml",
                "layout": {
                  "_global": "settings_input_layout",
                },
                "properties": {
                  "autoSize": {
                    "minRows": 2,
                  },
                  "label": {
                    "align": "right",
                    "extra": "yaml description",
                    "span": 8,
                  },
                  "placeholder": "Type YAML here",
                  "size": "small",
                  "title": "yaml",
                },
                "required": false,
                "type": "TextArea",
              },
            ],
            "id": "block.properties.arr.$",
            "layout": {
              "gap": 0,
            },
            "properties": {
              "bodyStyle": {
                "padding": 0,
              },
              "size": "small",
              "title": undefined,
            },
            "type": "Card",
          },
        ],
        "id": "block.properties.arr",
        "layout": {
          "gap": 0,
        },
        "properties": {
          "itemStyle": {
            "padding": 0,
          },
          "size": "small",
          "title": "arr:",
        },
        "type": "ControlledList",
      },
    ]
  `);
});

test('yaml schemaYamlInObjectInArray propertiesGetterTransformer', () => {
  expect(propertiesGetterTransformer(schemaYamlInObjectInArray, { block_type: 'Block' }))
    .toMatchInlineSnapshot(`
      {
        "_object.assign": [
          {
            "_state": {
              "contextId": "Block:Block:{}",
              "default": {},
              "key": "block.properties",
            },
          },
          {
            "arr": {
              "_array.map": {
                "callback": {
                  "_function": {
                    "__object.assign": [
                      {
                        "__args": {
                          "contextId": undefined,
                          "default": {},
                          "key": "0",
                        },
                      },
                      {
                        "yaml": {
                          "__yaml.parse": [
                            {
                              "__if_none": [
                                {
                                  "__args": {
                                    "contextId": undefined,
                                    "key": "0.yaml",
                                  },
                                },
                                "",
                              ],
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                "on": {
                  "_if_none": [
                    {
                      "_state": {
                        "contextId": "Block:Block:{}",
                        "key": "block.properties.arr",
                      },
                    },
                    [],
                  ],
                },
              },
            },
          },
        ],
      }
    `);
});

test('yaml schemaYamlInObjectInArray defaultValueTransformer', () => {
  expect(defaultValueTransformer(schemaYamlInObjectInArray)).toMatchInlineSnapshot(`
    {
      "arr": [],
    }
  `);
  const schemaYamlInObjectInArrayDV = {
    properties: {
      type: 'object',
      additionalProperties: false,
      properties: {
        arr: {
          type: 'array',
          description: 'arr description',
          default: [{ yaml: { b: 1 } }],
          items: {
            type: 'object',
            description: 'obj description',
            properties: {
              yaml: {
                type: 'object',
                description: 'yaml description',
                docs: {
                  displayType: 'yaml',
                },
              },
            },
          },
        },
      },
    },
  };
  expect(defaultValueTransformer(schemaYamlInObjectInArrayDV)).toMatchInlineSnapshot(`
    {
      "arr": [
        {
          "yaml": {
            "b": 1,
          },
        },
      ],
    }
  `);
});
