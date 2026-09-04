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

import { ConfigError } from '@lowdefy/errors';

// A .njk file with a yaml, yml or json sub-extension is parsed into config after
// rendering, so operators written in it are real operators that run at runtime.
// A .njk file without one renders to a string that is inserted into config as
// text - an operator written there is inert text that never runs, which is the
// mistake this check names.
const RUNTIME_OPERATORS = [
  '_state',
  '_request',
  '_user',
  '_global',
  '_url_query',
  '_event',
  '_actions',
  '_input',
  '_payload',
];

// Only an operator in config position (a `_state:` key or a `_state.field`
// path) is reported, so prose naming an operator in a text template is not.
const OPERATOR_IN_CONFIG_POSITION = new RegExp(
  `(?:^|[\\s\\-[{,])(${RUNTIME_OPERATORS.join('|')})\\s*[:.]`
);

function checkNjkRuntimeOperators({ content, path }) {
  const lines = content.split('\n');
  for (const [index, line] of lines.entries()) {
    const match = line.match(OPERATOR_IN_CONFIG_POSITION);
    if (match) {
      throw new ConfigError(
        `Nunjucks template "${path}" renders at build and its result is used as text, so the "${
          match[1]
        }" operator on line ${
          index + 1
        } never runs. Use the _nunjucks operator over a .txt file for a template that needs runtime values.`,
        {
          checkSlug: 'ref-njk-runtime-operator',
          filePath: path,
          lineNumber: index + 1,
          received: line.trim(),
        }
      );
    }
  }
}

export default checkNjkRuntimeOperators;
