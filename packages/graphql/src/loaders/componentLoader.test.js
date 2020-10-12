import path from 'path';
import createComponentLoader from './componentLoader';
import { ConfigurationError } from '../context/errors';

test('load component', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');
  const pageLoader = createComponentLoader({ CONFIGURATION_BASE_PATH });
  const res = await pageLoader.load('global');
  expect(res).toEqual({
    global: 'value',
  });
});

test('load page, page does not exist', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');
  const pageLoader = createComponentLoader({ CONFIGURATION_BASE_PATH });
  const res = await pageLoader.load('doesNotExist');
  expect(res).toEqual(null);
});

test('load component, invalid JSON', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config/pages');
  const pageLoader = createComponentLoader({ CONFIGURATION_BASE_PATH });
  await expect(pageLoader.load('invalid')).rejects.toThrow(ConfigurationError);
});
