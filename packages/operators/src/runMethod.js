import { type } from '@lowdefy/helpers';

const runMethods = ({
  allowedMethods,
  allowedProperties,
  Fn,
  location,
  method,
  operator,
  params,
}) => {
  if (type.isNone(method) && type.isString(params)) {
    if (!allowedProperties.includes(params)) {
      throw new Error(
        `Operator Error: ${operator} must be called with one of the following values: ${allowedProperties.join(
          ', '
        )}. Received: {"${operator}":${JSON.stringify(params)}} at ${location}.`
      );
    }
    return Fn[params];
  }
  if (type.isString(method) && type.isArray(params)) {
    if (!allowedMethods.includes(method)) {
      throw new Error(
        `Operator Error: ${operator} must be called with one of the following: ${allowedMethods.join(
          ', '
        )}. Received: {"${operator}.${method}":${JSON.stringify(params)}} at ${location}.`
      );
    }
    return Fn[method](...params);
  }
  throw new Error(
    `Operator Error: ${operator} must be called with one of the following properties: ${allowedProperties.join(
      ', '
    )}. Or Methods: ${allowedMethods.join(', ')}. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
};

export default runMethods;
