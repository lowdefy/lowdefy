import path from 'path';
import createPageLoader from './pageLoader';

test('load page', async () => {
  const CONFIGURATION_BASE_PATH = path.resolve(process.cwd(), 'src/test/config');
  const pageLoader = createPageLoader({ CONFIGURATION_BASE_PATH });
  const res = await pageLoader.load('page1');
  expect(res).toEqual({
    id: 'page:page1',
    type: 'PageSiderMenu',
  });
});
