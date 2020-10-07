import intlListFormat from '../src/intlListFormat';

test('no options', () => {
  expect(intlListFormat()(['Motorcycle', 'Bus', 'Car'])).toEqual('Motorcycle, Bus, and Car');
});

test('locales', () => {
  expect(intlListFormat({ locale: 'fr' })(['Motorcycle', 'Bus', 'Car'])).toEqual(
    'Motorcycle, Bus et Car'
  );
  expect(intlListFormat({ locale: 'de' })(['Motorcycle', 'Bus', 'Car'])).toEqual(
    'Motorcycle, Bus und Car'
  );
  expect(intlListFormat({ locale: 'ja' })(['Motorcycle', 'Bus', 'Car'])).toEqual(
    'Motorcycle、Bus、Car'
  );
});

test('options', () => {
  expect(
    intlListFormat({
      locale: 'en',
      options: { style: 'long', type: 'conjunction' },
    })(['Motorcycle', 'Bus', 'Car'])
  ).toEqual('Motorcycle, Bus, and Car');
  expect(
    intlListFormat({
      locale: 'de',
      options: { style: 'short', type: 'disjunction' },
    })(['Motorcycle', 'Bus', 'Car'])
  ).toEqual('Motorcycle, Bus oder Car');
  expect(
    intlListFormat({
      locale: 'en',
      options: { style: 'narrow', type: 'unit' },
    })(['Motorcycle', 'Bus', 'Car'])
  ).toEqual('Motorcycle Bus Car');
});
