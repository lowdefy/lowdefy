/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import ReactMarkdown from 'react-markdown';

import gfm from 'remark-gfm';

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

SyntaxHighlighter.registerLanguage('handlebars', handlebars.default);
SyntaxHighlighter.registerLanguage('nunjucks', handlebars.default);
SyntaxHighlighter.registerLanguage('html', handlebars.default);
SyntaxHighlighter.registerLanguage('java', java.default);
SyntaxHighlighter.registerLanguage('javascript', javascript.default);
SyntaxHighlighter.registerLanguage('js', javascript.default);
SyntaxHighlighter.registerLanguage('jsx', javascript.default);
SyntaxHighlighter.registerLanguage('json', json.default);
SyntaxHighlighter.registerLanguage('markdown', markdown.default);
SyntaxHighlighter.registerLanguage('python', python.default);
SyntaxHighlighter.registerLanguage('py', python.default);
SyntaxHighlighter.registerLanguage('typescript', typescript.default);
SyntaxHighlighter.registerLanguage('ts', typescript.default);
SyntaxHighlighter.registerLanguage('xml', xml.default);
SyntaxHighlighter.registerLanguage('yaml', yaml.default);

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
const MarkdownWithCode = ({ blockId, properties, methods }) => (
  <div id={blockId} className={methods.makeCssClass(properties.style)}>
    <ReactMarkdown
      className="markdown-body"
      skipHtml={properties.skipHtml}
      remarkPlugins={[gfm]}
      components={components}
    >
      {properties.content}
    </ReactMarkdown>
  </div>
);

MarkdownWithCode.defaultProps = blockDefaultProps;
MarkdownWithCode.meta = {
  category: 'container',
  icons: [],
  styles: [],
};

export default MarkdownWithCode;
