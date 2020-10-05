import type from '@lowdefy/type';
import merge from 'lodash.merge';

const mergeObjects = objects => {
  let merged = objects;
  if (type.isArray(objects)) {
    merged = merge(...objects.filter(obj => type.isObject(obj)));
  }
  return merged;
};

export default mergeObjects;
