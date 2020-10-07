import momentFormat from '../src/momentFormat';

test('no options', () => {
  expect(momentFormat()(new Date(1560414023345))).toEqual('2019-06-13T10:20:23+02:00');
  expect(momentFormat({})(new Date(1560414023345))).toEqual('2019-06-13T10:20:23+02:00');
});

test('locales', () => {
  expect(momentFormat({ locale: 'ar-EG' })(new Date(1560414023345))).toEqual(
    '٢٠١٩-٠٦-١٣T١٠:٢٠:٢٣+٠٢:٠٠'
  );
});

test('specify format', () => {
  expect(
    momentFormat({
      format: 'd MMM YYYY',
    })(new Date(1560414023345))
  ).toEqual('4 Jun 2019');
});
