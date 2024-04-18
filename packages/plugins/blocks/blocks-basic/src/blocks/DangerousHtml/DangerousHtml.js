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
import { type } from '@lowdefy/helpers';

class DangerousHtml extends React.Component {
  constructor(props) {
    super(props);
    this.div = {
      innerHTML: '',
    };
    // we do not revaluate DOMPurifyOptions improve options safety by not making options dynamic.
    this.DOMPurifyOptions = props.properties.DOMPurifyOptions;
  }

  componentDidMount() {
    const htmlString = type.isNone(this.props.properties.html)
      ? ''
      : this.props.properties.html.toString();
    this.div.innerHTML = DOMPurify.sanitize(htmlString, this.DOMPurifyOptions);
  }

  componentDidUpdate() {
    const htmlString = type.isNone(this.props.properties.html)
      ? ''
      : this.props.properties.html.toString();
    this.div.innerHTML = DOMPurify.sanitize(htmlString, this.DOMPurifyOptions);
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

DangerousHtml.defaultProps = blockDefaultProps;
DangerousHtml.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default DangerousHtml;
