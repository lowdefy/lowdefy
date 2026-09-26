/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { type } from '@lowdefy/helpers';

import collectExceptions from '../../utils/collectExceptions.js';
import { dataIconRegex } from '../buildImports/collectIconNames.js';
import createUnresolvedIconError from './createUnresolvedIconError.js';
import { qualifiedNamePattern, semanticNamePattern, setNamePattern } from './iconNamePatterns.js';
import resolveIconName from './resolveIconName.js';

const iconKeyRegex = /icon$/i;

// Style slots named after an icon (class['.icon'], classNames.icon, styles.icon) hold CSS,
// not icon names.
const styleKeys = new Set(['class', 'classNames', 'style', 'styles']);

function isOperator(node) {
  const keys = Object.keys(node).filter((key) => !key.startsWith('~'));
  return keys.length === 1 && keys[0].startsWith('_');
}

function isIconNameForm(value) {
  return (
    semanticNamePattern.test(value) ||
    setNamePattern.test(value) ||
    qualifiedNamePattern.test(value)
  );
}

// Raises a ConfigError for a literal icon name that resolves to nothing, but
// only at icon positions: the value of a key ending in "icon" (or that value's
// name), an Icon block's properties.name, and data-icon attributes. Strings
// elsewhere are free data and never errors. Operator subtrees are skipped:
// their arguments hold non-icon strings, and discovery still bundles the icon
// names inside them. Request properties are data sent to connections, and
// style subtrees hold CSS.
function validateIconNames({ config, icons, context }) {
  const reported = new Set();

  function checkName({ name, configKey }) {
    if (!isIconNameForm(name)) {
      return;
    }
    if (resolveIconName({ name, ...icons }) !== null) {
      return;
    }
    const reportKey = `${configKey}\n${name}`;
    if (reported.has(reportKey)) {
      return;
    }
    reported.add(reportKey);
    collectExceptions(context, createUnresolvedIconError({ name, icons, configKey }));
  }

  function checkIconValue({ value, configKey }) {
    if (type.isString(value)) {
      checkName({ name: value, configKey });
      return;
    }
    if (type.isObject(value) && !isOperator(value) && type.isString(value.name)) {
      checkName({ name: value.name, configKey: value['~k'] ?? configKey });
    }
  }

  function walk({ node, configKey }) {
    if (type.isString(node)) {
      for (const match of node.matchAll(dataIconRegex)) {
        checkName({ name: match[1], configKey });
      }
      return;
    }
    if (type.isArray(node)) {
      node.forEach((item) => walk({ node: item, configKey: node['~k'] ?? configKey }));
      return;
    }
    if (!type.isObject(node) || isOperator(node)) {
      return;
    }
    const nodeKey = node['~k'] ?? configKey;
    if (node.type === 'Icon' && type.isObject(node.properties)) {
      checkIconValue({
        value: node.properties.name,
        configKey: node.properties['~k'] ?? nodeKey,
      });
    }
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'requests' || styleKeys.has(key)) {
        return;
      }
      if (iconKeyRegex.test(key)) {
        checkIconValue({ value, configKey: nodeKey });
      }
      walk({ node: value, configKey: nodeKey });
    });
  }

  walk({ node: config, configKey: undefined });
}

export default validateIconNames;
