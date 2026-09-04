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
import * as espree from 'espree';
import * as eslintScope from 'eslint-scope';

const WRAPPER_NAME = '__lowdefy_js';

// The body is placed on line 2 of the wrapper so a reported line maps back to
// the body by subtracting 1.
function toBodyLine(loc) {
  return loc.line - 1;
}

function collectUndefinedNames({ scopeManager, params, globals }) {
  const allowed = new Set([...params, ...globals]);
  const seen = new Map();
  scopeManager.globalScope.through.forEach((reference) => {
    const name = reference.identifier.name;
    if (allowed.has(name) || seen.has(name)) return;
    const loc = reference.identifier.loc.start;
    seen.set(name, { name, line: toBodyLine(loc), column: loc.column });
  });
  return [...seen.values()];
}

function isInitialisationReference(reference, variable) {
  return reference.init === true && reference.resolved === variable;
}

function collectUnusedNames({ scopeManager }) {
  const unused = [];
  scopeManager.scopes.forEach((scope) => {
    scope.variables.forEach((variable) => {
      if (variable.name === WRAPPER_NAME) return;
      if (variable.defs.length === 0) return;
      // A catch binding is idiomatic to declare and never read, as is a
      // function parameter, so neither is reported as unused.
      if (variable.defs.some((def) => ['Parameter', 'CatchClause'].includes(def.type))) return;
      const used = variable.references.some(
        (reference) => !isInitialisationReference(reference, variable)
      );
      if (used) return;
      const loc = variable.defs[0].name.loc.start;
      unused.push({ name: variable.name, line: toBodyLine(loc), column: loc.column });
    });
  });
  return unused;
}

function lintJsBody({ body, params, globals }) {
  const prototype = `{ ${params.join(', ')} }`;
  const source = `const ${WRAPPER_NAME} = (${prototype}) => {\n${body}\n};`;
  let ast;
  try {
    ast = espree.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      loc: true,
      range: true,
    });
  } catch (error) {
    return {
      syntaxError: {
        message: error.message,
        line: (error.lineNumber ?? 1) - 1,
        column: error.column,
      },
    };
  }
  const scopeManager = eslintScope.analyze(ast, { ecmaVersion: 2024, sourceType: 'module' });
  return {
    undefinedNames: collectUndefinedNames({ scopeManager, params, globals }),
    unusedNames: collectUnusedNames({ scopeManager }),
  };
}

export default lintJsBody;
