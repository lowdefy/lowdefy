function _titleCase({ params }) {
  if (typeof params !== 'string') {
    throw new Error('_titleCase takes a string.');
  }
  return params.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export default _titleCase;
