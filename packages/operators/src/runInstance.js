import { type } from '@lowdefy/helpers';

const runInstance = ({ location, meta, methodName, operator, params, instanceType }) => {
  if (!meta[methodName]) {
    throw new Error(
      `Operator Error: ${operator}.${methodName} is not supported, use one of the following: ${Object.keys(
        meta
      ).join(', ')}.
      Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
  // validate params type
  if (meta[methodName].validTypes && !meta[methodName].validTypes.includes(type.typeOf(params))) {
    throw new Error(
      `Operator Error: ${operator}.${methodName} accepts one of the following types: ${meta[
        methodName
      ].validTypes.join(', ')}.
      Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
  let instance;
  let args = [];
  if (meta[methodName].singleArg || meta[methodName].property) {
    instance = params;
  } else {
    if (type.isArray(params)) {
      // Instance must be zero in list args.
      instance = params[0];
      args = params.slice(1);
    }
    // Instance must be listed first in named args.
    if (type.isObject(params)) {
      instance = params[meta[methodName].namedArgs[0]];
      args.push(...meta[methodName].namedArgs.slice(1).map((key) => params[key]));
      if (
        !type.isNone(meta[methodName].spreadArgs) &&
        !type.isArray(params[meta[methodName].spreadArgs])
      ) {
        throw new Error(
          `Operator Error: ${operator}.${methodName} takes an array as input argument for ${
            meta[methodName].spreadArgs
          }.
          Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
        );
      }
      args.push(...(params[meta[methodName].spreadArgs] || []));
    }
  }
  // console.log(instance);
  // console.log(type.typeOf(instance));
  if (!instance || type.typeOf(instance) !== instanceType) {
    throw new Error(`Operator Error: ${operator}.${methodName} must be evaluated on an ${instanceType} instance. For named args provide an ${instanceType} instance to the "on" property, for listed args provide and ${instanceType} instance as the first element in the operator argument array.
    Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`);
  }
  // Error for invalid method key.
  if (type.isNone(instance[methodName])) {
    throw new Error(
      `Operator Error: ${operator} must be evaluated using one of the following: ${Object.keys(
        meta
      ).join(', ')}.
      Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
  // for property
  if (meta[methodName].property) {
    return instance[methodName];
  }
  try {
    const result = instance[methodName](...args);
    if (meta[methodName].returnInstance) {
      return instance;
    }
    return result;
  } catch (e) {
    throw new Error(
      `Operator Error: ${operator}.${methodName} - ${
        e.message
      } Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
};

export default runInstance;
