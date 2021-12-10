/*
  Copyright 2020-2021 Lowdefy, Inc

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

import github from 'react-syntax-highlighter/dist/esm/styles/hljs/github.js';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript.js';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript.js';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python.js';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java.js';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml.js';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json.js';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml.js';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown.js';
import handlebars from 'react-syntax-highlighter/dist/esm/languages/hljs/handlebars.js';

SyntaxHighlighter.registerLanguage('handlebars', handlebars);
SyntaxHighlighter.registerLanguage('nunjucks', handlebars);
SyntaxHighlighter.registerLanguage('html', handlebars);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', javascript);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('yaml', yaml);

const components = {
  code: ({ language, children }) => (
    <SyntaxHighlighter style={github} language={language}>
      {children}
    </SyntaxHighlighter>
  ),
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
  loading: {
    type: 'SkeletonParagraph',
    properties: {
      lines: 7,
    },
  },
  icons: [],
  styles: [],
};

export default MarkdownWithCode;
