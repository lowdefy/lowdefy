import getFromObject from '../getFromObject';

function _state({ arrayIndices, context, contexts, env, location, params, state }) {
  return getFromObject({
    arrayIndices,
    context,
    contexts,
    env,
    location,
    object: state,
    operator: '_state',
    params,
  });
}

export default _state;
