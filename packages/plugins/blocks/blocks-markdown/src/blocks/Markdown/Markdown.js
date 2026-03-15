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
import { withBlockDefaults } from '@lowdefy/block-utils';
import ReactMarkdown from 'react-markdown';

import gfm from 'remark-gfm';

import markdownStyles from '../../style.module.css';
import codeblockStyles from '../../codeblock.module.css';

const Markdown = ({ blockId, classNames, properties, styles }) => (
  <div id={blockId} className={classNames?.element} style={styles?.element}>
    <ReactMarkdown
      className={`${markdownStyles['markdown-body']} ${codeblockStyles['markdown-default-code']}`}
      skipHtml={properties.skipHtml}
      remarkPlugins={[gfm]}
    >
      {properties.content}
    </ReactMarkdown>
  </div>
);

export default withBlockDefaults(Markdown);
