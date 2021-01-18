import { type } from '@lowdefy/helpers';

const runClass = ({ location, meta, methodName, operator, params, functions, defaultFunction }) => {
  if (!methodName) {
    if (meta[params]) {
      methodName = params;
    } else if (defaultFunction) {
      methodName = defaultFunction;
    } else {
      throw new Error(
        `Operator Error: ${operator} requires a valid method name, use one of the following: ${Object.keys(
          meta
        ).join(', ')}.
        Received: {"${operator}.${methodName}":${JSON.stringify(params)}} at ${location}.`
      );
    }
  }
  if (!meta[methodName] && !functions[methodName]) {
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
      args.push(...(meta[methodName].namedArgs || []).map((key) => params[key]));
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
