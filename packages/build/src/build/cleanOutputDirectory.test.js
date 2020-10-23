import cleanOutputDirectory from './cleanOutputDirectory';
import cleanDirectory from '../utils/files/cleanDirectory';

jest.mock('../utils/files/cleanDirectory', () => {
  return jest.fn();
});

beforeEach(() => {
  cleanDirectory.mockReset();
});

test('cleanOutputDirectory calls cleanDirectory', async () => {
  const context = {
    outputDirectory: 'outputDirectory',
  };
  await cleanOutputDirectory({ context });
  expect(cleanDirectory.mock.calls).toEqual([['outputDirectory']]);
});
