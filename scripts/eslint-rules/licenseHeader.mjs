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

const HEADER_PATTERN =
  /^\s*Copyright 2020-\d{4} Lowdefy, Inc\s+Licensed under the Apache License, Version 2\.0/;

function createHeader(year) {
  return `/*
  Copyright 2020-${year} Lowdefy, Inc

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

`;
}

// The end year is not checked: every file's year is bumped together each January, so a
// current-year check would fail the whole repository on 1 January.
const licenseHeader = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require the Apache license header at the top of every source file.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      missing:
        'Missing the Apache license header. Start the file with the header block from CLAUDE.md ("Required License Header"), "Copyright 2020-{{ year }} Lowdefy, Inc". `pnpm exec eslint --fix <file>` inserts it.',
    },
  },
  create(context) {
    const { sourceCode } = context;
    return {
      Program(node) {
        const firstToken = sourceCode.ast.tokens[0];
        const firstComment = sourceCode
          .getAllComments()
          .find((comment) => comment.type !== 'Shebang');
        const headerIsFirst =
          firstComment?.type === 'Block' &&
          HEADER_PATTERN.test(firstComment.value) &&
          (firstToken === undefined || firstComment.range[0] < firstToken.range[0]);
        if (headerIsFirst) return;
        const year = new Date().getFullYear();
        const shebang = sourceCode.getAllComments().find((comment) => comment.type === 'Shebang');
        context.report({
          node,
          loc: { line: 1, column: 0 },
          messageId: 'missing',
          data: { year },
          fix(fixer) {
            if (shebang) {
              return fixer.insertTextAfterRange(shebang.range, `\n${createHeader(year)}`);
            }
            return fixer.insertTextBeforeRange([0, 0], createHeader(year));
          },
        });
      },
    };
  },
};

export default licenseHeader;
