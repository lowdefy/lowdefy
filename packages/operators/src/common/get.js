import { applyArrayIndices, get, type } from '@lowdefy/helpers';

function _get({ params, location, arrayIndices }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Operator Error: _get takes an object as params. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }

  if (!type.isString(params.key)) {
    throw new Error(
      `Operator Error: _get.key takes a string. Received ${JSON.stringify(params)} at ${location}.`
    );
  }
  if (!type.isObject(params.from) && !type.isArray(params.from)) {
    return null;
  }
  return get(params.from, applyArrayIndices(arrayIndices, params.key), {
    default: get(params, 'default', { default: null }),
  });
}

export default _get;
