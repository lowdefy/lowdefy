import type from '@lowdefy/type';

// eslint-disable-next-line consistent-return
const getIndex = (value, options, key = 'value') => {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < options.length; i++) {
    if (type.isPrimitive(options[i]) && options[i] === value) {
      return i;
    }
    if (type.isObject(options[i]) && JSON.stringify(options[i][key]) === JSON.stringify(value)) {
      return i;
    }
  }
};
const getValueIndex = (value, options, multiple, key) => {
  if (!multiple) {
    return getIndex(value, options, key);
  }
  const index = [];
  value.forEach((val) => {
    index.push(getIndex(val, options, key));
  });
  return index;
};

export default getValueIndex;
