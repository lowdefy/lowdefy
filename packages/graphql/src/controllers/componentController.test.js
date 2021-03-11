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

import createComponentController from './componentController';
import { testBootstrapContext } from '../test/testContext';

const mockLoadComponent = jest.fn();
const loaders = {
  component: {
    load: mockLoadComponent,
  },
};

const context = testBootstrapContext({ loaders });
const contextUser = testBootstrapContext({ loaders, user: { sub: 'sub' } });

beforeEach(() => {
  mockLoadComponent.mockReset();
});

test('getLowdefyGlobal', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'global') {
      return {
        x: 'value',
      };
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getLowdefyGlobal();
  expect(res).toEqual({
    x: 'value',
  });
});

test('getLowdefyGlobal, global not found', async () => {
  mockLoadComponent.mockImplementation(() => {
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getLowdefyGlobal();
  expect(res).toEqual({});
});

test('getMenus, menus not found', async () => {
  mockLoadComponent.mockImplementation(() => {
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({ menus: [], homePageId: null });
});

test('getMenus, menu with configured home page id', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:0',
              menuItemId: '0',
              type: 'MenuGroup',
              auth: 'public',
              links: [
                {
                  id: 'menuitem:default:1',
                  menuItemId: '1',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: 'public',
                },
              ],
            },
          ],
        },
      ];
    }
    if (id === 'config') {
      return {
        homePageId: 'homePageId',
      };
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            menuItemId: '0',
            type: 'MenuGroup',
            auth: 'public',
            links: [
              {
                id: 'menuitem:default:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'public',
              },
            ],
          },
        ],
      },
    ],
    homePageId: 'homePageId',
  });
});

test('getMenus, get homePageId at first level', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:0',
              menuItemId: '0',
              type: 'MenuLink',
              pageId: 'page',
              auth: 'public',
            },
          ],
        },
      ];
    }
    if (id === 'config') {
      return {};
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            menuItemId: '0',
            type: 'MenuLink',
            pageId: 'page',
            auth: 'public',
          },
        ],
      },
    ],
    homePageId: 'page',
  });
});

test('getMenus, get homePageId at second level', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:0',
              menuItemId: '0',
              type: 'MenuGroup',
              auth: 'public',
              links: [
                {
                  id: 'menuitem:default:1',
                  menuItemId: '1',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: 'public',
                },
              ],
            },
          ],
        },
      ];
    }
    if (id === 'config') {
      return {};
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            menuItemId: '0',
            type: 'MenuGroup',
            auth: 'public',
            links: [
              {
                id: 'menuitem:default:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'public',
              },
            ],
          },
        ],
      },
    ],
    homePageId: 'page',
  });
});

test('getMenus, get homePageId at third level', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:0',
              menuItemId: '0',
              type: 'MenuGroup',
              auth: 'public',
              links: [
                {
                  id: 'menuitem:default:1',
                  menuItemId: '1',
                  type: 'MenuGroup',
                  auth: 'public',
                  links: [
                    {
                      id: 'menuitem:default:2',
                      menuItemId: '2',
                      type: 'MenuLink',
                      pageId: 'page',
                      auth: 'public',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
    }
    if (id === 'config') {
      return {};
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            menuItemId: '0',
            type: 'MenuGroup',
            auth: 'public',
            links: [
              {
                id: 'menuitem:default:1',
                menuItemId: '1',
                type: 'MenuGroup',
                auth: 'public',
                links: [
                  {
                    id: 'menuitem:default:2',
                    menuItemId: '2',
                    type: 'MenuLink',
                    pageId: 'page',
                    auth: 'public',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    homePageId: 'page',
  });
});

test('getMenus, no default menu, no configured homepage', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'my_menu',
          links: [
            {
              id: 'menuitem:my_menu:0',
              menuItemId: '0',
              type: 'MenuLink',
              pageId: 'page',
              auth: 'public',
            },
          ],
        },
      ];
    }
    if (id === 'config') {
      return {};
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'my_menu',
        links: [
          {
            id: 'menuitem:my_menu:0',
            menuItemId: '0',
            type: 'MenuLink',
            pageId: 'page',
            auth: 'public',
          },
        ],
      },
    ],
    homePageId: 'page',
  });
});

test('getMenus, more than 1 menu, no configured homepage', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'other',
          links: [
            {
              id: 'menuitem:other:0',
              menuItemId: '0',
              type: 'MenuLink',
              pageId: 'other-page',
              auth: 'public',
            },
          ],
        },
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:0',
              menuItemId: '0',
              type: 'MenuLink',
              pageId: 'default-page',
              auth: 'public',
            },
          ],
        },
      ];
    }
    if (id === 'config') {
      return {};
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'other',
        links: [
          {
            id: 'menuitem:other:0',
            menuItemId: '0',
            type: 'MenuLink',
            pageId: 'other-page',
            auth: 'public',
          },
        ],
      },
      {
        menuId: 'default',
        links: [
          {
            id: 'menuitem:default:0',
            menuItemId: '0',
            type: 'MenuLink',
            pageId: 'default-page',
            auth: 'public',
          },
        ],
      },
    ],
    homePageId: 'default-page',
  });
});

test('getMenus, default menu has no links', async () => {
  mockLoadComponent.mockImplementation((id) => {
    if (id === 'menus') {
      return [
        {
          menuId: 'default',
          links: [],
        },
      ];
    }
    if (id === 'config') {
      return {};
    }
    return null;
  });
  const controller = createComponentController(context);
  const res = await controller.getMenus();
  expect(res).toEqual({
    menus: [
      {
        menuId: 'default',
        links: [],
      },
    ],
    homePageId: null,
  });
});

describe('filter menus', () => {
  test('Menu all protected, public request', async () => {
    mockLoadComponent.mockImplementation((id) => {
      if (id === 'menus') {
        return [
          {
            menuId: 'default',
            links: [
              {
                id: 'menuitem:default:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'protected',
              },
              {
                id: 'menuitem:default:2',
                menuItemId: '2',
                type: 'MenuGroup',
                auth: 'public',
                links: [
                  {
                    id: 'menuitem:default:3',
                    menuItemId: '3',
                    type: 'MenuLink',
                    pageId: 'page',
                    auth: 'protected',
                  },
                  {
                    id: 'menuitem:default:4',
                    menuItemId: '4',
                    type: 'MenuGroup',
                    auth: 'public',
                    links: [
                      {
                        id: 'menuitem:default:5',
                        menuItemId: '5',
                        type: 'MenuLink',
                        pageId: 'page',
                        auth: 'protected',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            menuId: 'other',
            links: [
              {
                id: 'menuitem:other:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'protected',
              },
            ],
          },
        ];
      }
      if (id === 'config') {
        return {};
      }
      return null;
    });
    const controller = createComponentController(context);
    const res = await controller.getMenus();
    expect(res).toEqual({
      menus: [
        {
          menuId: 'default',
          links: [],
        },
        {
          menuId: 'other',
          links: [],
        },
      ],
      homePageId: null,
    });
  });

  test('Menu all protected, public request', async () => {
    mockLoadComponent.mockImplementation((id) => {
      if (id === 'menus') {
        return [
          {
            menuId: 'default',
            links: [
              {
                id: 'menuitem:default:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'protected',
              },
              {
                id: 'menuitem:default:2',
                menuItemId: '2',
                type: 'MenuGroup',
                auth: 'public',
                links: [
                  {
                    id: 'menuitem:default:3',
                    menuItemId: '3',
                    type: 'MenuLink',
                    pageId: 'page',
                    auth: 'protected',
                  },
                  {
                    id: 'menuitem:default:4',
                    menuItemId: '4',
                    type: 'MenuGroup',
                    auth: 'public',
                    links: [
                      {
                        id: 'menuitem:default:5',
                        menuItemId: '5',
                        type: 'MenuLink',
                        pageId: 'page',
                        auth: 'protected',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            menuId: 'other',
            links: [
              {
                id: 'menuitem:other:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'protected',
              },
            ],
          },
        ];
      }
      if (id === 'config') {
        return {};
      }
      return null;
    });
    const controller = createComponentController(contextUser);
    const res = await controller.getMenus();
    expect(res).toEqual({
      menus: [
        {
          menuId: 'default',
          links: [
            {
              id: 'menuitem:default:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: 'protected',
            },
            {
              id: 'menuitem:default:2',
              menuItemId: '2',
              type: 'MenuGroup',
              auth: 'public',
              links: [
                {
                  id: 'menuitem:default:3',
                  menuItemId: '3',
                  type: 'MenuLink',
                  pageId: 'page',
                  auth: 'protected',
                },
                {
                  id: 'menuitem:default:4',
                  menuItemId: '4',
                  type: 'MenuGroup',
                  auth: 'public',
                  links: [
                    {
                      id: 'menuitem:default:5',
                      menuItemId: '5',
                      type: 'MenuLink',
                      pageId: 'page',
                      auth: 'protected',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          menuId: 'other',
          links: [
            {
              id: 'menuitem:other:1',
              menuItemId: '1',
              type: 'MenuLink',
              pageId: 'page',
              auth: 'protected',
            },
          ],
        },
      ],
      homePageId: 'page',
    });
  });

  test('Menu filter some items, public request', async () => {
    mockLoadComponent.mockImplementation((id) => {
      if (id === 'menus') {
        return [
          {
            menuId: 'default',
            links: [
              {
                id: 'menuitem:default:1',
                menuItemId: '1',
                type: 'MenuLink',
                pageId: 'page',
                auth: 'protected',
              },
              {
                id: 'menuitem:default:2',
                menuItemId: '2',
                type: 'MenuGroup',
                auth: 'public',
                links: [
                  {
                    id: 'menuitem:default:3',
                    menuItemId: '3',
                    type: 'MenuLink',
                    pageId: 'page',
                    auth: 'protected',
                  },
                  {
                    id: 'menuitem:default:4',
                    menuItemId: '4',
                    type: 'MenuLink',
                    pageId: 'page',
                    auth: 'public',
                  },
                  {
                    id: 'menuitem:default:5',
                    menuItemId: '5',
                    type: 'MenuGroup',
                    auth: 'public',
                    links: [
                      {
                        id: 'menuitem:default:6',
                        menuItemId: '6',
                        type: 'MenuLink',
                        pageId: 'page',
                        auth: 'protected',
                      },
                    ],
                  },
                  {
                    id: 'menuitem:default:7',
                    menuItemId: '7',
                    type: 'MenuGroup',
                    auth: 'public',
                    links: [
                      {
                        id: 'menuitem:default:8',
                        menuItemId: '8',
                        type: 'MenuLink',
                        url: 'https://lowdefy.com',
                        auth: 'public',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ];
      }
      if (id === 'config') {
        return {};
      }
      return null;
    });
    const controller = createComponentController(context);
    const res = await controller.getMenus();
    expect(res).toEqual({
      homePageId: 'page',
      menus: [
        {
          links: [
            {
              id: 'menuitem:default:2',
              menuItemId: '2',
              type: 'MenuGroup',
              auth: 'public',
              links: [
                {
                  id: 'menuitem:default:4',
                  menuItemId: '4',
                  pageId: 'page',
                  type: 'MenuLink',
                  auth: 'public',
                },
                {
                  id: 'menuitem:default:7',
                  menuItemId: '7',
                  type: 'MenuGroup',
                  auth: 'public',
                  links: [
                    {
                      id: 'menuitem:default:8',
                      menuItemId: '8',
                      type: 'MenuLink',
                      url: 'https://lowdefy.com',
                      auth: 'public',
                    },
                  ],
                },
              ],
            },
          ],
          menuId: 'default',
        },
      ],
    });
  });
});
