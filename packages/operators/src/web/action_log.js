import getFromObject from '../getFromObject';

function _action_log({ params, actionLog, context, contexts, arrayIndices, location, env }) {
  return getFromObject({
    arrayIndices,
    context,
    contexts,
    env,
    location,
    object: actionLog,
    operator: '_action_log',
    params,
  });
}

export default _action_log;
