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

import { parse } from 'espree';

// A string literal, or a template literal with nothing interpolated: import(`pkg`).
function readStaticSpecifier(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }
  return null;
}

function isRequireCall(callee) {
  if (callee.type === 'Identifier') {
    return callee.name === 'require';
  }
  return (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'Identifier' &&
    callee.object.name === 'require' &&
    callee.property.name === 'resolve'
  );
}

// Parsing instead of pattern matching keeps import-shaped text in strings, comments and
// code generators from counting as imports.
function listImportSpecifiers({ source }) {
  const ast = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  });
  const specifiers = [];

  function addSpecifier(node) {
    const specifier = readStaticSpecifier(node);
    if (specifier !== null) specifiers.push(specifier);
  }

  function visit(node) {
    switch (node.type) {
      case 'ImportDeclaration':
      case 'ExportAllDeclaration':
      case 'ExportNamedDeclaration':
      case 'ImportExpression':
        addSpecifier(node.source);
        break;
      case 'CallExpression':
        if (isRequireCall(node.callee)) addSpecifier(node.arguments[0]);
        break;
      default:
        break;
    }
    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item?.type === 'string') visit(item);
        });
        return;
      }
      if (typeof value?.type === 'string') visit(value);
    });
  }

  visit(ast);
  return specifiers;
}

export default listImportSpecifiers;
