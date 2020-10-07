const fs = require('fs');

// Read the identity-obj-proxy as text. NOTE This only works because the entire module is inside one file
const identityObjProxySrc = fs.readFileSync(require.resolve('identity-obj-proxy'), 'utf-8');

/**
 * The jest config option "moduleNameMapper" does not resolve to absolute paths, which
 * can cause conflicts with similar file names. In this case, "style.less" and "style.js" are
 * both mocked with the identity-obj-proxy. This causes compiling of @material-ui to fail.
 * Instead use the "transforms" option to accomplish stubbing CSS/LESS files with identityObjProxy
 */

module.exports = {
  process() {
    return identityObjProxySrc;
  },
};
