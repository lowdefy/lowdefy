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

export default {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'type'],
  properties: {
    id: {
      type: 'string',
    },
    required: {
      type: ['boolean', 'object'],
    },
    type: {
      type: 'string',
    },
    properties: {
      type: 'object',
    },
    style: {
      type: 'object',
    },
    layout: {
      type: 'object',
    },
    blocks: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    events: {
      type: 'object',
    },
    menus: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id'],
        properties: {
          id: {
            type: 'string',
            description: 'Menu id.',
          },
          links: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'type'],
              properties: {
                id: {
                  type: 'string',
                  description: 'Menu item id.',
                },
                type: {
                  type: 'string',
                  enum: ['MenuDivider', 'MenuLink', 'MenuGroup'],
                  description: 'Menu item type.',
                },
                pageId: {
                  type: 'string',
                  description: 'Page to link to.',
                },
                style: {
                  type: 'object',
                  description: 'Css style to applied to link.',
                },
                properties: {
                  type: 'object',
                  description: 'properties from menu item.',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Menu item title.',
                    },
                    icon: {
                      type: ['string', 'object'],
                      description:
                        'Name of an React-Icon (See <a href="https://react-icons.github.io/react-icons/">all icons</a>) or properties of an Icon block to customize icon on menu item.',
                    },
                    danger: {
                      type: 'boolean',
                      description: 'Apply danger style to menu item.',
                    },
                    dashed: {
                      type: 'boolean',
                      default: false,
                      description: 'Whether the divider line is dashed.',
                    },
                  },
                },
                links: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'type'],
                    properties: {
                      id: {
                        type: 'string',
                        description: 'Menu item id.',
                      },
                      type: {
                        type: 'string',
                        enum: ['MenuDivider', 'MenuLink', 'MenuGroup'],
                        description: 'Menu item type.',
                      },
                      style: {
                        type: 'object',
                        description: 'Css style to applied to sub-link.',
                      },
                      pageId: {
                        type: 'string',
                        description: 'Page to link to.',
                      },
                      properties: {
                        type: 'object',
                        description: 'properties from menu item.',
                        properties: {
                          title: {
                            type: 'string',
                            description: 'Menu item title.',
                          },
                          danger: {
                            type: 'boolean',
                            description: 'Apply danger style to menu item.',
                          },
                          dashed: {
                            type: 'boolean',
                            default: false,
                            description: 'Whether the divider line is dashed.',
                          },
                        },
                        links: {
                          type: 'array',
                          items: {
                            type: 'object',
                            required: ['id', 'type'],
                            properties: {
                              id: {
                                type: 'string',
                                description: 'Menu item id.',
                              },
                              type: {
                                type: 'string',
                                enum: ['MenuDivider', 'MenuLink'],
                                description: 'Menu item type.',
                              },
                              style: {
                                type: 'object',
                                description: 'Css style to applied to sub-link.',
                              },
                              pageId: {
                                type: 'string',
                                description: 'Page to link to.',
                              },
                              properties: {
                                type: 'object',
                                description: 'properties from menu item.',
                                properties: {
                                  title: {
                                    type: 'string',
                                    description: 'Menu item title.',
                                  },
                                  danger: {
                                    type: 'boolean',
                                    description: 'Apply danger style to menu item.',
                                  },
                                  dashed: {
                                    type: 'boolean',
                                    default: false,
                                    description: 'Whether the divider line is dashed.',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    areas: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          type: 'object',
          properties: {
            blocks: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
  },
};
