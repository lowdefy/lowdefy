function add(a, b) {
  return a + b;
}

function transformer(obj) {
  return {
    json: JSON.stringify(obj),
    add: add(obj.a, 42),
  };
}

module.exports = transformer;
