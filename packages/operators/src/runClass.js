import { type } from '@lowdefy/helpers';

const runClass = ({ location, meta, methodName, operator, params, functions }) => {
  if (!methodName && type.isString(params)) {
    methodName = params;
  }
  if (!meta[methodName]) {
    throw new Error(
      `Operator Error: ${operator}.${methodName} is not supported, use one of the following types: ${Object.keys(
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
  if (meta[methodName].noArgs) {
    try {
      return functions[methodName]();
    } catch (e) {
      throw new Error(
        `Operator Error: ${operator}: - ${e.message} Received: {"${operator}":${JSON.stringify(
          params
        )}} at ${location}.`
      );
    }
  }
  let args = [];
  if (meta[methodName].singleArg || meta[methodName].property) {
    args = [params];
  } else {
    if (type.isArray(params)) {
      args = params;
    }
    if (type.isObject(params)) {
      args.push(...meta[methodName].namedArgs.map((key) => params[key]));
      args.push(...(meta[methodName].spreadArgs || []).map((key) => params[key]).flat());
    }
  }
  // Error for invalid method key.
  if (type.isNone(functions[methodName])) {
    throw new Error(
      `Operator Error: ${operator} must be evaluated using one of the following: ${Object.keys(
        meta
      ).join(', ')}.
      Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
  // for property
  if (meta[methodName].property) {
    return functions[methodName];
  }
  try {
    return functions[methodName](...args);
  } catch (e) {
    throw new Error(
      `Operator Error: ${operator}.${methodName} - ${
        e.message
      } Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
    );
  }
};

export default runClass;
