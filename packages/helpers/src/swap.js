import type from '@lowdefy/type';

const swap = (arr, from, to) => {
  if (!type.isArray(arr) || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return;
  }
  arr.splice(from, 1, arr.splice(to, 1, arr[from])[0]);
};

export default swap;
