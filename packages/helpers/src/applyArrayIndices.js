import type from '@lowdefy/type';

const applyArrayIndices = (arrayIndices, name) => {
  if (!type.isArray(arrayIndices)) return name;
  if (arrayIndices.length === 0) return name;
  const copy = JSON.parse(JSON.stringify(arrayIndices));
  const index = copy.shift();
  let newName;
  if (name.includes('$')) {
    newName = name.replace('$', index.toString());
  } else {
    newName = name;
  }
  return applyArrayIndices(copy, newName);
};

export default applyArrayIndices;
