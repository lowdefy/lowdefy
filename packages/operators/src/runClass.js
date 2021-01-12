import { type } from '@lowdefy/helpers';

const runClass = ({
  allowedMethods,
  allowedProperties,
  Cls,
  location,
  method,
  operator,
  params,
}) => {
  if (type.isNone(method) && type.isString(params)) {
    if (!allowedProperties.has(params)) {
      throw new Error(
        `Operator Error: ${operator} must be called with one of the following values: ${[
          ...allowedProperties,
        ].join(', ')}. Received: {"${operator}":${JSON.stringify(params)}} at ${location}.`
      );
    }
    return Cls[params];
  }
  if (type.isString(method) && type.isArray(params)) {
    if (!allowedMethods.has(method)) {
      throw new Error(
        `Operator Error: ${operator} must be called with one of the following: ${[
          ...allowedMethods,
        ].join(', ')}. Received: {"${operator}.${method}":${JSON.stringify(
          params
        )}} at ${location}.`
      );
    }
    try {
      return Cls[method](...params);
    } catch (e) {
      throw new Error(
        `Operator Error: ${operator}.${method} - ${
          e.message
        } Received: {"${operator}.${method}":${JSON.stringify(params)}} at ${location}.`
      );
    }
  }
  throw new Error(
    `Operator Error: ${operator} must be called with one of the following properties: ${[
      ...allowedProperties,
    ].join(', ')}; or methods: ${[...allowedMethods].join(', ')}. Received: ${JSON.stringify(
      params
    )} at ${location}.`
  );
};

export default runClass;
