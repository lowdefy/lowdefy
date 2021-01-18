import { v4 as uuidv4 } from 'uuid';
import uuid from '../../src/node/uuid';

jest.mock('uuid', () => {
  return {
    v4: jest.fn(() => 'ABC'),
  };
});

test('_uuid', () => {
  expect(uuid({ params: true, location: 'locationId' })).toEqual('ABC');
  expect(uuidv4).toHaveBeenCalled();
});
