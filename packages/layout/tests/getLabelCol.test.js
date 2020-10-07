import getLabelCol from '../src/getLabelCol';

test('with inline', () => {
  expect(getLabelCol({}, true)).toEqual({ flex: '0 1 auto' });
});

test('with no span value', () => {
  expect(getLabelCol({}, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
  });
});

test('with a span value', () => {
  expect(getLabelCol({ span: 3 }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 3 },
  });
});

test('with a xs span value', () => {
  expect(getLabelCol({ xs: { span: 3 } }, false)).toEqual({
    xs: { span: 3 },
    sm: { span: 24 },
  });
});

test('with a sm span value', () => {
  expect(getLabelCol({ sm: { span: 3 } }, false)).toEqual({
    xs: { span: 3 },
    sm: { span: 3 },
  });
});

test('with a md span value', () => {
  expect(getLabelCol({ md: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 3 },
  });
});

test('with a lg span value', () => {
  expect(getLabelCol({ lg: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    lg: { span: 3 },
  });
});

test('with a xl span value', () => {
  expect(getLabelCol({ xl: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    xl: { span: 3 },
  });
});

test('with a xxl span value', () => {
  expect(getLabelCol({ xxl: { span: 3 } }, false)).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    xxl: { span: 3 },
  });
});

test('with all desktop span values', () => {
  expect(
    getLabelCol({ md: { span: 1 }, lg: { span: 2 }, xl: { span: 3 }, xxl: { span: 4 } }, false)
  ).toEqual({
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 1 },
    lg: { span: 2 },
    xl: { span: 3 },
    xxl: { span: 4 },
  });
});

test('with all mobile span values', () => {
  expect(getLabelCol({ xs: { span: 1 }, sm: { span: 2 } }, false)).toEqual({
    xs: { span: 1 },
    sm: { span: 2 },
  });
});

test('with all span values', () => {
  expect(
    getLabelCol(
      {
        xs: { span: 11 },
        sm: { span: 22 },
        md: { span: 1 },
        lg: { span: 2 },
        xl: { span: 3 },
        xxl: { span: 4 },
      },
      false
    )
  ).toEqual({
    xs: { span: 11 },
    sm: { span: 22 },
    md: { span: 1 },
    lg: { span: 2 },
    xl: { span: 3 },
    xxl: { span: 4 },
  });
});
