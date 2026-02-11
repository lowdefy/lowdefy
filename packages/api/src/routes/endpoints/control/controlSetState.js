import { set } from '@lowdefy/helpers';

function controlSetState(context, routineContext, { control }) {
  const { logger, evaluateOperators } = context;
  const { items } = routineContext;

  const evaluatedSetState = evaluateOperators({
    input: control[':set_state'],
    items,
    location: control['~k'] ?? ':set_state',
  });

  logger.debug({
    event: 'debug_control_set_state',
    input: control[':set_state'],
    evaluated: evaluatedSetState,
  });

  Object.entries(evaluatedSetState).forEach(([key, value]) => {
    set(context.state, key, value);
  });

  return { status: 'continue' };
}

export default controlSetState;
