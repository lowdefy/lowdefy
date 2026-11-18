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

function findVariable({ scope, name }) {
  let current = scope;
  while (current) {
    const variable = current.set.get(name);
    if (variable) return variable;
    current = current.upper;
  }
  return null;
}

// Packages build with swc and test with vitest using the classic JSX runtime (.swcrc), where
// <Foo /> compiles to React.createElement, so React must be in scope wherever there is JSX.
// ESLint does not know that, so without this rule no-unused-vars reports the React import, and
// removing it breaks the package at runtime.
const reactInJsxScope = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Mark React as used by JSX and, for the classic JSX runtime, require it in scope.',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: { runtime: { enum: ['classic', 'automatic'] } },
        additionalProperties: false,
      },
    ],
    messages: {
      missing:
        "JSX compiles to React.createElement in this package (classic runtime, .swcrc), so React must be in scope. Add `import React from 'react';`.",
    },
  },
  create(context) {
    const runtime = context.options[0]?.runtime ?? 'classic';
    const { sourceCode } = context;
    let reported = false;
    function check(node) {
      const variable = findVariable({ scope: sourceCode.getScope(node), name: 'React' });
      if (variable) {
        sourceCode.markVariableAsUsed('React', node);
        return;
      }
      if (runtime !== 'classic' || reported) return;
      reported = true;
      context.report({
        node,
        messageId: 'missing',
        fix(fixer) {
          const firstImport = sourceCode.ast.body.find(
            (statement) => statement.type === 'ImportDeclaration'
          );
          if (!firstImport) return null;
          return fixer.insertTextBefore(firstImport, "import React from 'react';\n");
        },
      });
    }
    return {
      JSXOpeningElement: check,
      JSXOpeningFragment: check,
    };
  },
};

export default reactInJsxScope;
