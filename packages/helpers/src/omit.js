import del from '@lowdefy/delete';

const omit = (obj, list) => {
  list.forEach((item) => {
    del(obj, item);
  });
  return obj;
};

export default omit;
