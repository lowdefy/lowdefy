import { connections } from './index';

test('All connections are present', () => {
  expect(connections.Stripe).toBeDefined();
});
