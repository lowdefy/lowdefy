import getFromObject from '../getFromObject';

function _global({ arrayIndices, env, location, lowdefyGlobal, params }) {
  return getFromObject({
    arrayIndices,
    env,
    location,
    object: lowdefyGlobal,
    operator: '_global',
    params,
  });
}

export default _global;
