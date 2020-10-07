import intlNumberFormat from '../src/intlNumberFormat';

test('no options', () => {
  expect(intlNumberFormat()(1)).toEqual('1');
  expect(intlNumberFormat()(1.23)).toEqual('1.23');
  expect(intlNumberFormat()(1000000)).toEqual('1,000,000');
  expect(intlNumberFormat()(13182375813.47422)).toEqual('13,182,375,813.474');
});

test('locales', () => {
  expect(intlNumberFormat({ locale: 'en-IN' })(13182375813.47422)).toEqual('13,18,23,75,813.474');
  expect(intlNumberFormat({ locale: 'de' })(13182375813.47422)).toEqual('13.182.375.813,474');
  expect(intlNumberFormat({ locale: 'ar-EG' })(13182375813.47422)).toEqual('١٣٬١٨٢٬٣٧٥٬٨١٣٫٤٧٤');
});

test('options', () => {
  expect(
    intlNumberFormat({
      locale: 'ja-JP',
      options: { style: 'currency', currency: 'JPY' },
    })(12364374.6)
  ).toEqual('￥12,364,375');
  expect(
    intlNumberFormat({
      locale: 'en-ZA',
      options: { style: 'currency', currency: 'ZAR' },
    })(12364374.6)
  ).toEqual('R 12 364 374,60');
  expect(
    intlNumberFormat({
      locale: 'de-DE',
      options: { style: 'currency', currency: 'EUR' },
    })(12364374.6)
  ).toEqual('12.364.374,60 €');
  expect(
    intlNumberFormat({
      locale: 'pt-PT',
      options: { style: 'unit', unit: 'mile-per-hour' },
    })(12364374.6)
  ).toEqual('12 364 374,6 mi/h');
  expect(
    intlNumberFormat({
      locale: 'en-GB',
      options: {
        style: 'unit',
        unit: 'liter',
        unitDisplay: 'long',
      },
    })(12364374.6)
  ).toEqual('12,364,374.6 litres');
});
