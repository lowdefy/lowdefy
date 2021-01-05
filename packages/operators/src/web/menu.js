import getFromArray from '../getFromArray';

function _menu({ params, menus, location }) {
  return getFromArray({ params, array: menus, key: 'menuId', operator: '_menu', location });
}

export default _menu;
