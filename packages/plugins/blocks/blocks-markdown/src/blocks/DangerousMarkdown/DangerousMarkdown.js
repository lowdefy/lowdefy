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
import DOMPurify from 'dompurify';
import { blockDefaultProps } from '@lowdefy/block-utils';
import ReactMarkdown from 'react-markdown';

import gfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

class DangerousMarkdown extends React.Component {
  constructor(props) {
    super(props);
    // we do not revaluate DOMPurifyOptions improve options safety by not making options dynamic.
    this.DOMPurifyOptions = props.properties.DOMPurifyOptions;
  }

  render() {
    const { blockId, properties, methods } = this.props;
    return (
      <div id={blockId} className={methods.makeCssClass(properties.style)}>
        <ReactMarkdown
          className="markdown-body markdown-default-code"
          remarkPlugins={[gfm]}
          rehypePlugins={[rehypeRaw]}
          skipHtml={false}
        >
          {DOMPurify.sanitize(this.props.properties.content, this.DOMPurifyOptions)}
        </ReactMarkdown>
      </div>
    );
  }
}

DangerousMarkdown.defaultProps = blockDefaultProps;
DangerousMarkdown.meta = {
  category: 'container',
  icons: [],
  styles: ['codeblock.less'],
};

export default DangerousMarkdown;
