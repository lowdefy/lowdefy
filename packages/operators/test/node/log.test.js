/* eslint-disable max-classes-per-file */
import NodeParser from '../../src/nodeParser';

const logger = console.log;
const mockLogger = jest.fn();
beforeEach(() => {
  console.log = mockLogger;
  mockLogger.mockReset();
});
afterAll(() => {
  console.log = logger;
});
const args = {};

test('_log a string', () => {
  const input = { a: { _log: 'value' } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 'value',
  });
  expect(mockLogger).toHaveBeenCalledWith('value');
});

test('_log a number', () => {
  const input = { a: { _log: 1 } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 1,
  });
  expect(mockLogger).toHaveBeenCalledWith(1);
});

test('_log a null', () => {
  const input = { a: { _log: null } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: null,
  });
  expect(mockLogger).toHaveBeenCalledWith(null);
});

// TODO: Confirm if this is expected behaviour??
test('_log a undefined', () => {
  const input = { a: { _log: undefined } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: {},
  });
  expect(mockLogger).not.toHaveBeenCalled();
});

test('_log a 0', () => {
  const input = { a: { _log: 0 } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: 0,
  });
  expect(mockLogger).toHaveBeenCalledWith(0);
});

test('_log a false', () => {
  const input = { a: { _log: false } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: false,
  });
  expect(mockLogger).toHaveBeenCalledWith(false);
});

test('_log a object', () => {
  const input = { a: { _log: { b: 1 } } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: { b: 1 },
  });
  expect(mockLogger).toHaveBeenCalledWith({ b: 1 });
});

test('_log a array', () => {
  const input = { a: { _log: [{ b: 1 }] } };
  const parser = new NodeParser();
  const res = parser.parse({ input, args, location: 'locationId' });
  expect(res.output).toEqual({
    a: [{ b: 1 }],
  });
  expect(mockLogger).toHaveBeenCalledWith([{ b: 1 }]);
});
