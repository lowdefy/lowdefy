import { ServerParser } from '@lowdefy/operators';

function createEvaluateOperators(context, { payload }) {
  const { jsMap, operators, secrets, state, user } = context;

  const operatorsParser = new ServerParser({
    jsMap,
    operators,
    payload,
    secrets,
    state,
    user,
  });
  function evaluateOperators({ input, location }) {
    const { output, errors } = operatorsParser.parse({
      input,
      location,
    });
    if (errors.length > 0) {
      throw new Error(errors[0]);
    }

    return output;
  }

  return evaluateOperators;
}

export default createEvaluateOperators;
