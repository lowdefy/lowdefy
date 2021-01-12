import yaml from '../../src/common/yaml';

test('_yaml.parse string unquoted', () => {
  expect(yaml({ params: ['firstName'], location: 'locationId', method: 'parse' })).toEqual(
    'firstName'
  );
});

test('_yaml.parse string quoted', () => {
  expect(yaml({ params: ['"firstName"'], location: 'locationId', method: 'parse' })).toEqual(
    'firstName'
  );
});

test('_yaml.parse number', () => {
  expect(yaml({ params: ['1'], location: 'locationId', method: 'parse' })).toEqual(1);
});

test('_yaml.parse boolean true', () => {
  expect(yaml({ params: ['true'], location: 'locationId', method: 'parse' })).toEqual(true);
});

test('_yaml.parse boolean false', () => {
  expect(yaml({ params: ['false'], location: 'locationId', method: 'parse' })).toEqual(false);
});

test('_yaml.parse null', () => {
  expect(yaml({ params: ['null'], location: 'locationId', method: 'parse' })).toEqual(null);
});

test('_yaml.parse undefined string', () => {
  expect(yaml({ params: ['undefined'], location: 'locationId', method: 'parse' })).toEqual(
    undefined
  );
});

test('_yaml.parse object not allowed', () => {
  expect(() =>
    yaml({ params: [{ a: 'b' }], location: 'locationId', method: 'parse' })
  ).toMatchInlineSnapshot(`[Function]`);
});

test('_yaml.parse date not supported', () => {
  expect(() =>
    yaml({ params: [new Date(0)], location: 'locationId', method: 'parse' })
  ).toMatchInlineSnapshot(`[Function]`);
});

test('_yaml.parse array', () => {
  expect(
    yaml({
      params: [
        `- a: a1
- a: a2`,
      ],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual([{ a: 'a1' }, { a: 'a2' }]);
});

test('_yaml.parse date array', () => {
  expect(
    yaml({
      params: [
        `- _date: "1970-01-01T00:00:00.000Z"
- _date: "1970-01-01T00:00:00.001Z"`,
      ],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual([new Date(0), new Date(1)]);
});

test('_yaml.parse date as object', () => {
  expect(
    yaml({
      params: [`_date: "1970-01-01T00:00:00.000Z"`],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual(new Date(0));
});

test('_yaml.parse date object', () => {
  expect(
    yaml({
      params: [
        `a:
  _date: "1970-01-01T00:00:00.000Z"`,
      ],
      location: 'locationId',
      method: 'parse',
    })
  ).toEqual({ a: new Date(0) });
});

test('_yaml.parse non string', () => {
  expect(() =>
    yaml({ params: [123], location: 'locationId', method: 'parse' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _yaml.parse - Input must be a string type. Received: {\\"_yaml.parse\\":[123]} at locationId."`
  );
});

test('_yaml.stringify string', () => {
  expect(yaml({ params: ['firstName'], location: 'locationId', method: 'stringify' }))
    .toEqual(`firstName
`);
});

test('_yaml.stringify number', () => {
  expect(yaml({ params: [1], location: 'locationId', method: 'stringify' })).toEqual(`1
`);
});

test('_json.stringify boolean true', () => {
  expect(yaml({ params: [true], location: 'locationId', method: 'stringify' })).toEqual(`true
`);
});

test('_yaml.stringify boolean false', () => {
  expect(yaml({ params: [false], location: 'locationId', method: 'stringify' })).toEqual(`false
`);
});

test('_yaml.stringify null', () => {
  expect(yaml({ params: [null], location: 'locationId', method: 'stringify' })).toEqual(`null
`);
});

test('_yaml.stringify undefined in object', () => {
  expect(yaml({ params: [{ b: undefined }], location: 'locationId', method: 'stringify' }))
    .toEqual(`{}
`);
});

test('_yaml.stringify undefined', () => {
  expect(() =>
    yaml({ params: [undefined], location: 'locationId', method: 'stringify' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _yaml.stringify - unacceptable kind of an object to dump [object Undefined] Received: {\\"_yaml.stringify\\":[null]} at locationId."`
  );
});

test('_yaml.stringify date', () => {
  expect(yaml({ params: [new Date(0)], location: 'locationId', method: 'stringify' }))
    .toMatchInlineSnapshot(`
    "_date: '1970-01-01T00:00:00.000Z'
    "
  `);
});

test('_yaml.stringify array', () => {
  expect(
    yaml({ params: [[{ a: 'a1' }, { a: 'a2' }]], location: 'locationId', method: 'stringify' })
  ).toMatchInlineSnapshot(`
    "- a: a1
    - a: a2
    "
  `);
});

test('_yaml.stringify date array', () => {
  expect(
    yaml({ params: [[new Date(0), new Date(1)]], location: 'locationId', method: 'stringify' })
  ).toMatchInlineSnapshot(`
    "- _date: '1970-01-01T00:00:00.000Z'
    - _date: '1970-01-01T00:00:00.001Z'
    "
  `);
});

test('_yaml.stringify date object', () => {
  expect(yaml({ params: [{ a: new Date(0) }], location: 'locationId', method: 'stringify' }))
    .toMatchInlineSnapshot(`
    "a:
      _date: '1970-01-01T00:00:00.000Z'
    "
  `);
});
