import { connections } from './index';

test('All connections are present', () => {
  expect(connections.AwsS3Bucket).toBeDefined();
});
