import { ObjectID } from 'mongodb';
import { serialize, deserialize } from './serialize';

test('serialize dates', () => {
  const object = {
    date: new Date(0),
    array: [new Date(0)],
  };
  expect(serialize(object)).toEqual({
    date: { _date: 0 },
    array: [{ _date: 0 }],
  });
});

test('deserialize dates', () => {
  const object = {
    date: { _date: 0 },
    array: [{ _date: 0 }],
  };
  expect(deserialize(object)).toEqual({
    date: new Date(0),
    array: [new Date(0)],
  });
});

test('deserialize does not turn dates to strings', () => {
  const object = {
    date: new Date(0),
    array: [new Date(0)],
  };
  expect(deserialize(object)).toEqual({
    date: new Date(0),
    array: [new Date(0)],
  });
});

test('serialize mongodb object id', () => {
  const object = {
    objectid: ObjectID.createFromHexString('5e53d8403108c4b9fa51765d'),
    array: [ObjectID.createFromHexString('5e53d8403108c4b9fa51765d')],
  };
  expect(serialize(object)).toEqual({
    objectid: { _oid: '5e53d8403108c4b9fa51765d' },
    array: [{ _oid: '5e53d8403108c4b9fa51765d' }],
  });
});

test('deserialize mongodb object id', () => {
  const object = {
    objectid: { _oid: '5e53d8403108c4b9fa51765d' },
    array: [{ _oid: '5e53d8403108c4b9fa51765d' }],
  };
  expect(deserialize(object)).toEqual({
    objectid: ObjectID.createFromHexString('5e53d8403108c4b9fa51765d'),
    array: [ObjectID.createFromHexString('5e53d8403108c4b9fa51765d')],
  });
});

test('undefined', () => {
  expect(deserialize(undefined)).toEqual(undefined);
  expect(serialize(undefined)).toEqual(undefined);
});
