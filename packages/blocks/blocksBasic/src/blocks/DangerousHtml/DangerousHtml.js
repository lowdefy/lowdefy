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
import DOMPurify from 'dompurify';
import { blockDefaultProps } from '@lowdefy/block-tools';

class HtmlBlock extends React.Component {
  constructor(props) {
    super(props);
    this.div = {
      innerHTML: '',
    };
    // we do not revaluate DOMPurifyOptions improve options safety by not making options dynamic.
    this.DOMPurifyOptions = this.props.properties.DOMPurifyOptions;
  }

  componentDidMount() {
    // this.div.innerHTML = this.props.properties.html;
    this.div.innerHTML = DOMPurify.sanitize(this.props.properties.html, this.DOMPurifyOptions);
  }

  componentDidUpdate() {
    // this.div.innerHTML = this.props.properties.html;
    this.div.innerHTML = DOMPurify.sanitize(this.props.properties.html, this.DOMPurifyOptions);
  }

  render() {
    const { blockId, properties, methods } = this.props;
    return (
      <div
        id={blockId}
        data-testid={blockId}
        ref={(el) => {
          if (el) {
            this.div = el;
          }
        }}
        className={methods.makeCssClass(properties.style)}
      />
    );
  }
}

HtmlBlock.defaultProps = blockDefaultProps;

export default HtmlBlock;
