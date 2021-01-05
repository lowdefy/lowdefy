import getFromObject from '../getFromObject';

function _args({ args, arrayIndices, env, location, params }) {
  return getFromObject({
    arrayIndices,
    env,
    location,
    object: args,
    operator: '_args',
    params,
  });
}

export default _args;
