/*
  Copyright 2020 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-tools';
import ReactMarkdown from 'react-markdown';

import gfm from 'remark-gfm';
import github from 'react-syntax-highlighter/dist/cjs/styles/hljs/github';

import javascript from 'react-syntax-highlighter/dist/cjs/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/hljs/typescript';
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python';
import java from 'react-syntax-highlighter/dist/cjs/languages/hljs/java';
import xml from 'react-syntax-highlighter/dist/cjs/languages/hljs/xml';
import json from 'react-syntax-highlighter/dist/cjs/languages/hljs/json';
import yaml from 'react-syntax-highlighter/dist/cjs/languages/hljs/yaml';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/hljs/markdown';
import handlebars from 'react-syntax-highlighter/dist/cjs/languages/hljs/handlebars';

import '../../Markdown.css';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('handlebars', handlebars);
SyntaxHighlighter.registerLanguage('nunjucks', handlebars);
SyntaxHighlighter.registerLanguage('html', handlebars);

const renderers = {
  code: ({ language, value }) => (
    <SyntaxHighlighter style={github} language={language}>
      {value}
    </SyntaxHighlighter>
  ),
};

const MarkdownWithHtml = ({ blockId, properties, methods }) => (
  <div id={blockId} className={methods.makeCssClass(properties.style)}>
    <ReactMarkdown
      className="markdown-body"
      renderers={renderers}
      plugins={[gfm]}
      allowDangerousHtml={properties.allowDangerousHtml}
    >
      {properties.content}
    </ReactMarkdown>
  </div>
);

MarkdownWithHtml.defaultProps = blockDefaultProps;

export default MarkdownWithHtml;
