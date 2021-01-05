import getFromObject from '../getFromObject';

function _request_details({ params, requests, context, contexts, arrayIndices, location, env }) {
  return getFromObject({
    arrayIndices,
    context,
    contexts,
    env,
    location,
    object: requests,
    operator: '_request_details',
    params,
  });
}

export default _request_details;
