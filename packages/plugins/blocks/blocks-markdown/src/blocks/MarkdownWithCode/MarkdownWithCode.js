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

import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { withBlockDefaults } from '@lowdefy/block-utils';
import ReactMarkdown from 'react-markdown';

import gfm from 'remark-gfm';

import markdownStyles from '../../style.module.css';
import codeblockStyles from '../../codeblock.module.css';

// See https://github.com/react-syntax-highlighter/react-syntax-highlighter/issues/393 for esm issue.
import { github } from 'react-syntax-highlighter/dist/cjs/styles/hljs/index.js';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript.js';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript.js';
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python.js';
import java from 'react-syntax-highlighter/dist/cjs/languages/hljs/java.js';
import xml from 'react-syntax-highlighter/dist/cjs/languages/hljs/xml.js';
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json.js';
import yaml from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml.js';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/hljs/markdown.js';
import handlebars from 'react-syntax-highlighter/dist/cjs/languages/hljs/handlebars.js';

// Handle CJS/ESM interop: webpack gives { default: fn }, Turbopack may give fn directly.
const lang = (m) => m.default || m;

SyntaxHighlighter.registerLanguage('handlebars', lang(handlebars));
SyntaxHighlighter.registerLanguage('nunjucks', lang(handlebars));
SyntaxHighlighter.registerLanguage('html', lang(handlebars));
SyntaxHighlighter.registerLanguage('java', lang(java));
SyntaxHighlighter.registerLanguage('javascript', lang(javascript));
SyntaxHighlighter.registerLanguage('js', lang(javascript));
SyntaxHighlighter.registerLanguage('jsx', lang(javascript));
SyntaxHighlighter.registerLanguage('json', lang(json));
SyntaxHighlighter.registerLanguage('markdown', lang(markdown));
SyntaxHighlighter.registerLanguage('python', lang(python));
SyntaxHighlighter.registerLanguage('py', lang(python));
SyntaxHighlighter.registerLanguage('typescript', lang(typescript));
SyntaxHighlighter.registerLanguage('ts', lang(typescript));
SyntaxHighlighter.registerLanguage('xml', lang(xml));
SyntaxHighlighter.registerLanguage('yaml', lang(yaml));

const components = {
  code({ inline, className, children, ...props }) {
    return !inline ? (
      <SyntaxHighlighter
        style={github}
        language={String(className).replace('language-', '')}
        {...props}
      >
        {children}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};
const MarkdownWithCode = ({ blockId, classNames, properties, styles }) => (
  <div id={blockId} className={classNames?.element} style={styles?.element}>
    <ReactMarkdown
      className={markdownStyles['markdown-body']}
      skipHtml={properties.skipHtml}
      remarkPlugins={[gfm]}
      components={components}
    >
      {properties.content}
    </ReactMarkdown>
  </div>
);

MarkdownWithCode.meta = {
  category: 'container',
  icons: [],
};

export default withBlockDefaults(MarkdownWithCode);
