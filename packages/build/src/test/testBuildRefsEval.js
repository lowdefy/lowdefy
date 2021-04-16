function add(a, b) {
  return a + b;
}

function js(obj, vars) {
  return {
    json: JSON.stringify(obj),
    add: add(obj.a, 42),
    var: vars.var1,
  };
}

module.exports = js;
