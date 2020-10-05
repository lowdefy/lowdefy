import type from '@lowdefy/type';

const getUniqueValues = (arr, key = 'value') => {
  const arr2 = arr.map((o) => {
    if (type.isPrimitive(o)) {
      return JSON.stringify(o);
    }
    return JSON.stringify(o[key]);
  });
  return arr.filter((opt, i) => {
    if (type.isPrimitive(opt)) {
      return arr2.indexOf(JSON.stringify(opt)) === i;
    }
    return arr2.indexOf(JSON.stringify(opt[key])) === i;
  });
};

export default getUniqueValues;
