import getFromObject from '../getFromObject';

function _secret({ env, location, params, secrets }) {
  return getFromObject({
    env,
    location,
    object: secrets,
    operator: '_secret',
    params,
  });
}

export default _secret;
