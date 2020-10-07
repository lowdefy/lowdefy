import type from '@lowdefy/type';

const gutterSetup = (gutter) => {
  if (type.isInt(gutter) || type.isObject(gutter)) {
    return [gutter, gutter];
  }
  return gutter;
};

export default gutterSetup;
