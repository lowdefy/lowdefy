import mediaToCssObject from '../src/mediaToCssObject';

test('no object', () => {
  expect(mediaToCssObject()).toEqual({});
});

test('object with no media unchanged', () => {
  const obj = {
    a: 'a',
    b: 1,
    c: { a: 'b' },
  };
  expect(mediaToCssObject(obj)).toEqual(obj);
});

test('object with all media', () => {
  const obj = {
    a: 'a',
    xs: { a: 'xs' },
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
    xxl: { a: 'xxl' },
  };
  expect(mediaToCssObject(obj)).toMatchInlineSnapshot(`
    Object {
      "@media screen and (max-width: 576px)": Object {
        "a": "xs",
      },
      "@media screen and (min-width: 1200px)": Object {
        "a": "xxl",
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
});

test('object with all media with react option', () => {
  const obj = {
    a: 'a',
    xs: { a: 'xs' },
    sm: { a: 'sm' },
    md: { a: 'md' },
    lg: { a: 'lg' },
    xl: { a: 'xl' },
    xxl: { a: 'xxl' },
  };
  expect(mediaToCssObject(obj, { react: true })).toMatchInlineSnapshot(`
    Object {
      "@media screen and (maxWidth: 576px)": Object {
        "a": "xs",
      },
      "@media screen and (minWidth: 1200px)": Object {
        "a": "xxl",
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
    }
  `);
});
