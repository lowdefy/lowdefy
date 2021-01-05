import { type } from '@lowdefy/helpers';

function getFromArray({ params, array, key, operator, location }) {
  if (params === true) return array;
  if (type.isString(params)) {
    return array.find((item) => item[key] === params);
  }
  if (type.isNumber(params)) {
    return array[params];
  }
  if (type.isObject(params)) {
    if (params.all === true) return array;
    if (type.isString(params.value)) return array.find((item) => item[key] === params.value);
    if (type.isNumber(params.index)) return array[params.index];
    if (!type.isNone(params.value) && !type.isString(params.value)) {
      throw new Error(
        `Operator Error: ${operator}.value must be of type string. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
    if (!type.isNone(params.index) && !type.isNumber(params.index)) {
      throw new Error(
        `Operator Error: ${operator}.index must be of type number. Received: ${JSON.stringify(
          params
        )} at ${location}.`
      );
    }
  }
  throw new Error(
    `Operator Error: ${operator} must be of type string, number or object. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
}

export default getFromArray;
