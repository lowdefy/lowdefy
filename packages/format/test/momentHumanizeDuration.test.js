import momentHumanizeDuration from '../src/momentHumanizeDuration';

test('no options', () => {
  expect(momentHumanizeDuration()(245923000)).toEqual('3 days');
  expect(momentHumanizeDuration({})(245923000)).toEqual('3 days');
});

test('locales', () => {
  expect(momentHumanizeDuration({ locale: 'ar-EG' })(245923000)).toEqual('٣ أيام');
});

test('withSuffix', () => {
  expect(
    momentHumanizeDuration({
      withSuffix: true,
    })(245923000)
  ).toEqual('in 3 days');
  expect(
    momentHumanizeDuration({
      withSuffix: true,
    })(-245923000)
  ).toEqual('3 days ago');
});

test('thresholds', () => {
  expect(momentHumanizeDuration({})(604800000)).toEqual('7 days');
  expect(
    momentHumanizeDuration({
      thresholds: { d: 7, w: 4 },
    })(604800000)
  ).toEqual('a week');
});
