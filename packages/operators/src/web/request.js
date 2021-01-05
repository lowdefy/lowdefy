import { type } from '@lowdefy/helpers';

function _request({ params, requests, location }) {
  if (!type.isString(params)) {
    throw new Error(
      `Operator Error: _request accepts a string value. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params in requests && !requests[params].loading) {
    return requests[params].response;
  }
  return null; // return null for all requests which has not been filled on init
}

export default _request;
