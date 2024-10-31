import { type } from '@lowdefy/helpers';

function notImplemented() {
  console.log('Not Implemented');
}

async function handleAction(context, action) {
  console.log('Handle action', action);
  // operators
}

async function handleIf(context, item) {
  console.log('handleIf', item);

  // item[':if'] === true or item[':if']
  if (item[':if']) {
    if (item[':then']) {
      await recRunRoutine(context, item[':then']);
    }
  } else if (item[':else']) {
    await recRunRoutine(context, item[':else']);
  }
}

const objectHandlers = {
  type: handleAction,
  ':setState': notImplemented,
  ':log': notImplemented,
  ':return': notImplemented,
  ':if': handleIf,
  ':switch': notImplemented,
  ':try': notImplemented,
  ':parallel': notImplemented,
  ':foreach': notImplemented,
  ':while': notImplemented,
  ':break': notImplemented,
};

async function handleObject(context, { routine }) {
  for (const [key, handler] of Object.entries(objectHandlers)) {
    console.log(key, handler);
    if (routine[key]) {
      await handler(context, { routine });
      return;
    }
  }
  throw new Error('Unexpected object', { cause: routine });
}

async function recRunRoutine(context, { routine }) {
  if (type.isObject(routine)) {
    await handleObject(context, { routine });
    return;
  }
  if (type.isArray(routine)) {
    for (const item of routine) {
      await recRunRoutine(context, { routine: item });
    }
    return;
  }
  throw new Error('Invalid routine', { cause: { routine } });
}

function runRoutine(context, { routine }) {
  const state = {};
  return recRunRoutine(context, { routine });
}

export default runRoutine;
