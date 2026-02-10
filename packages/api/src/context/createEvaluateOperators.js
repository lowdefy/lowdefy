import { ServerParser } from '@lowdefy/operators';
import { PluginError } from '@lowdefy/errors/server';

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
      const error = errors[0];
      // Extract operator name from received: { _if: params }
      const operatorName = error.received ? Object.keys(error.received)[0] : null;
      throw new PluginError({
        error,
        pluginType: 'operator',
        pluginName: operatorName,
        received: error.received,
        location: error.operatorLocation,
        configKey: error.configKey,
      });
    }

    return output;
  }

  return evaluateOperators;
}

export default createEvaluateOperators;
