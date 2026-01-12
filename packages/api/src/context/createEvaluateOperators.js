import { ServerParser } from '@lowdefy/operators';

function createEvaluateOperators(context) {
  const { jsMap, operators, payload, secrets, state, steps, user } = context;

  const operatorsParser = new ServerParser({
    jsMap,
    operators,
    payload,
    secrets,
    state,
    steps,
    user,
  });
  function evaluateOperators({ input, items, location }) {
    const { output, errors } = operatorsParser.parse({
      input,
      items,
      location,
    });
    if (errors.length > 0) {
      // Preserve the error object with configKey for config tracing
      const error = errors[0];
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error);
    }

    return output;
  }

  return evaluateOperators;
}

export default createEvaluateOperators;
