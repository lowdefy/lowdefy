import { applyArrayIndices, get, type } from '@lowdefy/helpers';

const contextKeys = {
  _action_log: 'actionLog',
  _state: 'state',
  _input: 'input',
  _request_details: 'requests',
  _mutation_details: 'mutations',
  _url_query: 'urlQuery',
};

function addListener({ context, targetContext }) {
  if (context.id === targetContext.id) {
    return;
  }
  targetContext.updateListeners.add(context.id);
}

function getFromOtherContext({ params, context, contexts, arrayIndices, operator, location }) {
  const { contextId } = params;
  if (!type.isString(contextId)) {
    throw new Error(
      `Operator Error: ${operator}.contextId must be of type string. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  const targetContext = contexts[contextId];
  if (!type.isObject(targetContext)) {
    throw new Error(
      `Operator Error: Context ${contextId} not found. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  addListener({ context, targetContext });
  const object = targetContext[contextKeys[operator]];
  if (params.all === true) return object;
  if (type.isString(params.key)) {
    return get(object, applyArrayIndices(arrayIndices, params.key), {
      default: get(params, 'default', { default: null }),
    });
  }
  return object;
}

export default getFromOtherContext;
