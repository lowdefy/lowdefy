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

import makeCssClass from '../src/makeCssClass';

const mockCss = jest.fn();
const mockCssImp = (obj) => ({
  emotionClassFor: obj,
});

jest.mock('create-emotion', () => () => ({
  css: (obj) => mockCss(obj),
}));

beforeEach(() => {
  mockCss.mockReset();
  mockCss.mockImplementation(mockCssImp);
});

test('object with no media', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(makeCssClass(obj)).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "a": "a",
        "b": 1,
        "c": Object {
          "a": "b",
        },
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('objects with no media', () => {
  const obj1 = {
    a: 'a',
    c: { a: 'b', d: 1 },
  };
  const obj2 = {
    c: { a: 'c' },
  };
  expect(makeCssClass([obj1, obj2])).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "a": "a",
        "c": Object {
          "a": "c",
          "d": 1,
        },
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('objects with media', () => {
  const obj = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  expect(makeCssClass(obj)).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "@media screen and (max-width: 576px)": Object {
          "a": "sm",
          "c": 1,
        },
        "@media screen and (min-width: 576px)": Object {
          "a": "md",
        },
        "@media screen and (min-width: 768px)": Object {
          "a": "lg",
        },
        "@media screen and (min-width: 992px)": Object {
          "a": "xl",
        },
        "a": "a",
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('objects with media', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'x',
    sm: { a: 'smsm' },
    md: { a: 'md' },
    lg: { a: 'lg', c: { sm: { a: '1' } } },
    xl: { a: 'xl' },
  };
  expect(makeCssClass([obj1, obj2])).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "@media screen and (max-width: 576px)": Object {
          "a": "smsm",
          "c": 1,
        },
        "@media screen and (min-width: 576px)": Object {
          "a": "md",
        },
        "@media screen and (min-width: 768px)": Object {
          "a": "lg",
          "c": Object {
            "sm": Object {
              "a": "1",
            },
          },
        },
        "@media screen and (min-width: 992px)": Object {
          "a": "xl",
        },
        "a": "x",
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('object with no media, react', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(makeCssClass(obj, { react: true })).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "a": "a",
        "b": 1,
        "c": Object {
          "a": "b",
        },
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('objects with no media, react', () => {
  const obj1 = {
    a: 'a',
    c: { a: 'b', d: 1 },
  };
  const obj2 = {
    c: { a: 'c' },
  };
  expect(makeCssClass([obj1, obj2], { react: true })).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "a": "a",
        "c": Object {
          "a": "c",
          "d": 1,
        },
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('objects with media, react', () => {
  const obj = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  expect(makeCssClass(obj, { react: true })).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "@media screen and (maxWidth: 576px)": Object {
          "a": "sm",
          "c": 1,
        },
        "@media screen and (minWidth: 576px)": Object {
          "a": "md",
        },
        "@media screen and (minWidth: 768px)": Object {
          "a": "lg",
        },
        "@media screen and (minWidth: 992px)": Object {
          "a": "xl",
        },
        "a": "a",
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('objects with media, react', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'x',
    sm: { a: 'smsm' },
    md: { a: 'md' },
    lg: { a: 'lg', c: { sm: { a: '1' } } },
    xl: { a: 'xl' },
  };
  expect(makeCssClass([obj1, obj2], { react: true })).toMatchInlineSnapshot(`
    Object {
      "emotionClassFor": Object {
        "@media screen and (maxWidth: 576px)": Object {
          "a": "smsm",
          "c": 1,
        },
        "@media screen and (minWidth: 576px)": Object {
          "a": "md",
        },
        "@media screen and (minWidth: 768px)": Object {
          "a": "lg",
          "c": Object {
            "sm": Object {
              "a": "1",
            },
          },
        },
        "@media screen and (minWidth: 992px)": Object {
          "a": "xl",
        },
        "a": "x",
      },
    }
  `);
  expect(mockCss).toHaveBeenCalled();
});

test('object with no media, styleObjectOnly', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(makeCssClass(obj, { styleObjectOnly: true })).toMatchInlineSnapshot(`
    Object {
      "a": "a",
      "b": 1,
      "c": Object {
        "a": "b",
      },
    }
  `);
  expect(mockCss).not.toHaveBeenCalled();
});

test('objects with no media, styleObjectOnly', () => {
  const obj1 = {
    a: 'a',
    c: { a: 'b', d: 1 },
  };
  const obj2 = {
    c: { a: 'c' },
  };
  expect(makeCssClass([obj1, obj2], { styleObjectOnly: true })).toMatchInlineSnapshot(`
    Object {
      "a": "a",
      "c": Object {
        "a": "c",
        "d": 1,
      },
    }
  `);
  expect(mockCss).not.toHaveBeenCalled();
});

test('objects with media, styleObjectOnly', () => {
  const obj = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  expect(makeCssClass(obj, { styleObjectOnly: true })).toMatchInlineSnapshot(`
    Object {
      "@media screen and (max-width: 576px)": Object {
        "a": "sm",
        "c": 1,
      },
      "@media screen and (min-width: 576px)": Object {
        "a": "md",
      },
      "@media screen and (min-width: 768px)": Object {
        "a": "lg",
      },
      "@media screen and (min-width: 992px)": Object {
        "a": "xl",
      },
      "a": "a",
    }
  `);
  expect(mockCss).not.toHaveBeenCalled();
});

test('objects with media, styleObjectOnly', () => {
  const obj1 = {
    a: 'a',
    sm: { a: 'sm', c: 1 },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
  };
  const obj2 = {
    a: 'x',
    sm: { a: 'smsm' },
    md: { a: 'md' },
    lg: { a: 'lg', c: { sm: { a: '1' } } },
    xl: { a: 'xl' },
  };
  expect(makeCssClass([obj1, obj2], { styleObjectOnly: true })).toMatchInlineSnapshot(`
    Object {
      "@media screen and (max-width: 576px)": Object {
        "a": "smsm",
        "c": 1,
      },
      "@media screen and (min-width: 576px)": Object {
        "a": "md",
      },
      "@media screen and (min-width: 768px)": Object {
        "a": "lg",
        "c": Object {
          "sm": Object {
            "a": "1",
          },
        },
      },
      "@media screen and (min-width: 992px)": Object {
        "a": "xl",
      },
      "a": "x",
    }
  `);
  expect(mockCss).not.toHaveBeenCalled();
});
