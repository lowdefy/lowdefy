import connections from '../src/index';

test('All connections are present', () => {
  expect(connections.AxiosHttp).toBeDefined();
});
