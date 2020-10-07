import intlDateTimeFormat from '../src/intlDateTimeFormat';

test('no options', () => {
  const formatter = intlDateTimeFormat();
  expect(formatter(new Date(1560414023345))).toEqual('6/13/2019');
});

test('locales', () => {
  expect(intlDateTimeFormat({ locale: 'ar-EG' })(new Date(1560414023345))).toEqual('١٣‏/٦‏/٢٠١٩');
  expect(intlDateTimeFormat({ locale: 'ja-JP-u-ca-japanese' })(new Date(1560414023345))).toEqual(
    'R1/6/13'
  );
});

test('options', () => {
  expect(
    intlDateTimeFormat({
      locale: 'en',
      options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    })(new Date(1560414023345))
  ).toEqual('Thursday, June 13, 2019');
  expect(
    intlDateTimeFormat({
      locale: 'en',
      options: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'Australia/Sydney',
        timeZoneName: 'short',
      },
    })(new Date(1560414023345))
  ).toEqual('6:20:23 PM GMT+10');
});
