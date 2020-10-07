import layoutParamsToArea from '../src/layoutParamsToArea';

test('empty area and layout', () => {
  const layout = {};
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual(area);
});

test('layout fields', () => {
  const layout = {
    contentAlign: 1,
    contentJustify: 2,
    contentDirection: 3,
    contentWrap: 4,
    contentOverflow: 5,
    contentGutter: 6,
  };
  const area = {};
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  });
});

test('area fields', () => {
  const layout = {};
  const area = {
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  });
});

test('area and layout', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 4,
    overflow: 5,
    gutter: 6,
  });
});

test('some area and layout', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 1,
    justify: 2,
    direction: 3,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
    justify: 2,
    direction: 3,
    wrap: 44,
    overflow: 55,
    gutter: 66,
  });
});

test('some area and layout with 0', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 0,
    justify: 0,
    direction: 0,
    wrap: 0,
    overflow: 0,
    gutter: 0,
  };
  const areaKey = 'content';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 0,
    justify: 0,
    direction: 0,
    wrap: 0,
    overflow: 0,
    gutter: 0,
  });
});

test('area and layout not content', () => {
  const layout = {
    contentAlign: 11,
    contentJustify: 22,
    contentDirection: 33,
    contentWrap: 44,
    contentOverflow: 55,
    contentGutter: 66,
  };
  const area = {
    align: 1,
  };
  const areaKey = 'none';
  expect(layoutParamsToArea({ areaKey, area, layout })).toEqual({
    align: 1,
  });
});
