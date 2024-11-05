import { ServerParser } from '@lowdefy/operators';

function getOperatorsParser(context, { payload }) {
  const { jsMap, operators, secrets, user } = context;

  return new ServerParser({
    jsMap,
    operators,
    payload,
    secrets,
    user,
  });
}

export default getOperatorsParser;
