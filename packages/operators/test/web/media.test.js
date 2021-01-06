/* eslint-disable no-global-assign */
import media from '../../src/web/media';

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 300 });
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
});

test('_media full media object', () => {
  expect(media({ params: true, location: 'locationId' })).toEqual({
    height: 300,
    size: 'xs',
    width: 500,
  });
});

test('_media size', () => {
  expect(media({ params: 'size', location: 'locationId' })).toEqual('xs');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 700 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('sm');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 900 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('md');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1100 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('lg');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1400 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('xl');
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1900 });
  expect(media({ params: 'size', location: 'locationId' })).toEqual('xxl');
});

test('_media width', () => {
  expect(media({ params: 'width', location: 'locationId' })).toEqual(500);
});

test('_media height', () => {
  expect(media({ params: 'height', location: 'locationId' })).toEqual(300);
});

test('_media throw on no innerWidth', () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: undefined,
  });
  expect(() => media({ params: true, location: 'locationId' })).toThrow(
    'Operator Error: device window width not available for _media. Received: true at locationId.'
  );
});
