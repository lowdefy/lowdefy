import { ObjectID } from 'mongodb';
import { type } from '@lowdefy/helpers';

function replacer(_, value) {
  if (type.isObject(value)) {
    Object.keys(value).forEach((key) => {
      if (value[key] instanceof ObjectID) {
        // eslint-disable-next-line no-param-reassign
        value[key] = { _oid: value[key].toHexString() };
      }
      if (type.isDate(value[key])) {
        // eslint-disable-next-line no-param-reassign
        value[key] = { _date: value[key].valueOf() };
      }
    });

    return value;
  }
  if (type.isArray(value)) {
    return value.map((item) => {
      if (item instanceof ObjectID) {
        return { _oid: item.toHexString() };
      }
      if (type.isDate(item)) {
        // eslint-disable-next-line no-param-reassign
        return { _date: item.valueOf() };
      }
      return item;
    });
  }
  return value;
}

function reviver(key, value) {
  if (type.isObject(value)) {
    if (value._oid) {
      return ObjectID.createFromHexString(value._oid);
    }
    if (type.isInt(value._date) || type.isString(value._date)) {
      return new Date(value._date);
    }
  }
  return value;
}

function serialize(obj) {
  if (type.isUndefined(obj)) return obj;
  return JSON.parse(JSON.stringify(obj, replacer));
}

// need to use replacer here, since objects are already partially deserialised.
// otherwise dates become strings
function deserialize(obj) {
  if (type.isUndefined(obj)) return obj;
  return JSON.parse(JSON.stringify(obj, replacer), reviver);
}

export { serialize, deserialize };
