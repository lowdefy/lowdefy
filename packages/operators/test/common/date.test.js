import date from '../../src/common/date';

const location = 'locationId';

test('_date now', () => {
  const RealDate = Date;
  const constantDate = new Date();
  global.Date = class extends Date {
    constructor() {
      super();
      return constantDate;
    }
  };
  expect(date({ params: 'now', location })).toEqual(constantDate);
  expect(date({ params: null, location, methodName: 'now' })).toEqual(constantDate);
  global.Date = RealDate;
});

test('_date from string', () => {
  expect(date({ params: '2018-01-01T12:00:00.000Z', location })).toEqual(
    new Date('2018-01-01T12:00:00.000Z')
  );
});

test('_date short format', () => {
  expect(date({ params: '2018-01-01', location })).toEqual(new Date('2018-01-01'));
});

test('_date from unix timestamp', () => {
  expect(date({ params: 1569579992, location })).toEqual(new Date(1569579992));
});

test('_date float', () => {
  expect(date({ params: 1.3, location })).toEqual(new Date(1.3));
});

test('_date negative int', () => {
  expect(date({ params: -1000, location })).toEqual(new Date(-1000));
});

test('_date null', () => {
  expect(() => date({ params: null, location })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _date.__default accepts one of the following types: number, string.
          Received: {\\"_date.__default\\":null} at locationId."
  `);
});

test('_date invalid operator type', () => {
  expect(() => date({ params: {}, location })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _date.__default accepts one of the following types: number, string.
          Received: {\\"_date.__default\\":{}} at locationId."
  `);
});

test('_date invalid string', () => {
  expect(() => date({ params: 'abc', location })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _date.__default - abc could not resolve as a valid javascript date. Received: {\\"_date.__default\\":\\"abc\\"} at locationId."`
  );
});
