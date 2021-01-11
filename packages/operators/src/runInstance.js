import { type } from '@lowdefy/helpers';

const runInstance = ({ allowedMethods, allowedProperties, location, method, operator, params }) => {
  if (
    !type.isString(method) ||
    (!allowedProperties.includes(method) && !allowedMethods.includes(method))
  ) {
    throw new Error(
      `Operator Error: ${operator} must be called with one of the following properties: ${allowedProperties.join(
        ', '
      )}; or methods: ${allowedMethods.join(
        ', '
      )}. Received: {"${operator}.${method}":${JSON.stringify(params)}} at ${location}.`
    );
  }
  if (!type.isArray(params) || type.isUndefined(params[0])) {
    throw new Error(
      `Operator Error: ${operator} takes an array with the first argument the instance on which to evaluate "${method}". Received: {"${operator}.${method}":${JSON.stringify(
        params
      )}} at ${location}.`
    );
  }
  if (type.isNull(params[0])) {
    return null;
  }
  const Instance = params[0];
  if (allowedProperties.includes(method)) {
    return Instance[method];
  }
  try {
    return Instance[method](...params.slice(1));
  } catch (e) {
    throw new Error(
      `Operator Error: ${operator}.${method} - ${
        e.message
      } Received: {"${operator}.${method}":${JSON.stringify(params)}} at ${location}.`
    );
  }
};

export default runInstance;
