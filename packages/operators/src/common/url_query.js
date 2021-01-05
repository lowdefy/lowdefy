import getFromObject from '../getFromObject';

function _url_query({ arrayIndices, context, contexts, env, location, params, urlQuery }) {
  return getFromObject({
    arrayIndices,
    context,
    contexts,
    env,
    location,
    object: urlQuery,
    operator: '_url_query',
    params,
  });
}

export default _url_query;
