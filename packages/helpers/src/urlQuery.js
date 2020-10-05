import type from '@lowdefy/type';
import queryString from 'query-string';
import serializer from '@lowdefy/serializer';

const parse = (str) => {
  const parsed = queryString.parse(str);
  const deserialized = {};
  Object.keys(parsed).forEach((key) => {
    try {
      deserialized[key] = serializer.deserializeFromString(parsed[key]);
    } catch (error) {
      deserialized[key] = parsed[key];
    }
  });
  return deserialized;
};

const stringify = (object) => {
  if (!type.isObject(object)) {
    return '';
  }
  const toSerialize = {};
  Object.keys(object).forEach((key) => {
    toSerialize[key] = serializer.serializeToString(object[key]);
  });
  return queryString.stringify(toSerialize);
};

export default { stringify, parse };
