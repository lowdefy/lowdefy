import intlRelativeTimeFormat from '../src/intlRelativeTimeFormat';

test('only unit specified', () => {
  expect(intlRelativeTimeFormat({ unit: 'days' })(4)).toEqual('in 4 days');
  expect(intlRelativeTimeFormat({ unit: 'days' })(-4)).toEqual('4 days ago');
});

test('locales', () => {
  expect(intlRelativeTimeFormat({ unit: 'days', locale: 'fr' })(4)).toEqual('dans 4 jours');
});

test('options', () => {
  expect(intlRelativeTimeFormat({ unit: 'days', options: { numeric: 'auto' } })(1)).toEqual(
    'tomorrow'
  );
});
