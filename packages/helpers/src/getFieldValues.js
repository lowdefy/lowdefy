import serializer from '@lowdefy/serializer';

function getFieldValues(operatorName, ...args) {
  const result = new Set();
  function reviver(key, value) {
    if (key === operatorName) {
      result.add(value);
    }
    return value;
  }
  [...args].forEach((element) => {
    serializer.deserializeFromString(serializer.serializeToString(element), { reviver });
  });
  return [...result];
}

export default getFieldValues;
