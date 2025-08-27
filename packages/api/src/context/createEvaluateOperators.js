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
      throw new Error(errors[0]);
    }

    return output;
  }

  return evaluateOperators;
}

export default createEvaluateOperators;
