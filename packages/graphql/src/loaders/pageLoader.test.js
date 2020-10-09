import path from 'path';
import createPageLoader from './pageLoader';
import { ConfigurationError } from '../context/errors';

test('load page', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');
  const pageLoader = createPageLoader({ CONFIGURATION_BASE_PATH });
  const res = await pageLoader.load('page1');
  expect(res).toEqual({
    id: 'page:page1',
    type: 'PageSiderMenu',
  });
});

test('load page, page does not exist', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');
  const pageLoader = createPageLoader({ CONFIGURATION_BASE_PATH });
  const res = await pageLoader.load('doesNotExist');
  expect(res).toEqual(null);
});

test('load page, invalid JSON', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');
  const pageLoader = createPageLoader({ CONFIGURATION_BASE_PATH });
  await expect(pageLoader.load('invalid')).rejects.toThrow(ConfigurationError);
});
