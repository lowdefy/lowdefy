import color from '../src/index';

test('antd blue test', () => {
  expect(color('#1890ff', 1)).toEqual('#e6f7ff');
  expect(color('#1890ff', 2)).toEqual('#bae7ff');
  expect(color('#1890ff', 3)).toEqual('#91d5ff');
  expect(color('#1890ff', 4)).toEqual('#69c0ff');
  expect(color('#1890ff', 5)).toEqual('#40a9ff');
  expect(color('#1890ff', 6)).toEqual('#178fff');
  expect(color('#1890ff', 7)).toEqual('#096dd9');
  expect(color('#1890ff', 8)).toEqual('#0050b3');
  expect(color('#1890ff', 9)).toEqual('#003a8c');
  expect(color('#1890ff', 10)).toEqual('#002766');
});
