import getFieldValues from '../src/getFieldValues';

test('single object', () => {
  expect(getFieldValues('_req', { _req: 1 })).toEqual([1]);
});

test('multiple objects', () => {
  expect(getFieldValues('_req', { _req: 1 }, { _req: 2 }, { _req: 1 }, { _req: 4 })).toEqual([
    1,
    2,
    4,
  ]);
});

test('multiple arrays', () => {
  expect(
    getFieldValues('_req', [{ _req: 1 }], [{ _req: 2 }], [{ _req: 1 }], [{ _req: 4 }])
  ).toEqual([1, 2, 4]);
});

test('multiple mixed', () => {
  expect(getFieldValues('_req', [{ _req: 1 }], { _req: 2 }, { _req: 1 }, [{ _req: 4 }])).toEqual([
    1,
    2,
    4,
  ]);
});

test('get on object of operator', () => {
  const data = {
    a: '1',
    defaultValue: { _request: 'a' },
  };
  expect(getFieldValues('defaultValue', data)).toEqual([{ _request: 'a' }]);
});
