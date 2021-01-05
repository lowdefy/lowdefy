import getFromObject from '../getFromObject';

function _input({ arrayIndices, context, contexts, env, input, location, params }) {
  return getFromObject({
    arrayIndices,
    context,
    contexts,
    env,
    location,
    object: input,
    operator: '_input',
    params,
  });
}

export default _input;
