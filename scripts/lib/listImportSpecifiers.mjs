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

function isMember({ node, object, property }) {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === object &&
    node.property.name === property
  );
}

// require('pkg'), require.resolve('pkg') and import.meta.resolve('pkg').
function isResolvingCall(callee) {
  if (callee.type === 'Identifier') {
    return callee.name === 'require';
  }
  if (isMember({ node: callee, object: 'require', property: 'resolve' })) {
    return true;
  }
  return (
    callee.type === 'MemberExpression' &&
    callee.object.type === 'MetaProperty' &&
    callee.object.meta.name === 'import' &&
    callee.property.name === 'resolve'
  );
}

// Static imports and re-exports are top-level statements. Only files that mention a
// dynamic import, require or import.meta.resolve need the whole tree walked, which keeps
// the check fast (most files have none).
const deepSpecifierPattern = /\bimport\s*\(|\brequire\s*(\.\s*resolve\s*)?\(|import\.meta\.resolve/;

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
        if (isResolvingCall(node.callee)) addSpecifier(node.arguments[0]);
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

  if (deepSpecifierPattern.test(source)) {
    visit(ast);
    return specifiers;
  }
  ast.body.forEach((statement) => {
    if (
      statement.type === 'ImportDeclaration' ||
      statement.type === 'ExportAllDeclaration' ||
      statement.type === 'ExportNamedDeclaration'
    ) {
      addSpecifier(statement.source);
    }
  });
  return specifiers;
}

export default listImportSpecifiers;
