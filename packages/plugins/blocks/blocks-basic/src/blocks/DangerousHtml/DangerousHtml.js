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
import DOMPurify from 'dompurify';
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

class DangerousHtml extends React.Component {
  constructor(props) {
    super(props);
    this.div = {
      innerHTML: '',
    };
    // The sanitizer options are fixed at mount on purpose: a later, operator-driven
    // value could loosen the sanitizer from state. A change is refused loudly
    // rather than ignored silently.
    this.DOMPurifyOptions = props.properties.DOMPurifyOptions;
    this.warnedOptionsChange = false;
  }

  sanitize() {
    const { html, DOMPurifyOptions } = this.props.properties;
    if (
      !this.warnedOptionsChange &&
      JSON.stringify(DOMPurifyOptions) !== JSON.stringify(this.DOMPurifyOptions)
    ) {
      this.warnedOptionsChange = true;
      console.warn(
        `DangerousHtml block "${this.props.blockId}": DOMPurifyOptions changed after mount and the change is ignored. The sanitizer options are fixed at the first render; write them as a literal, not from state.`
      );
    }
    const htmlString = type.isNone(html) ? '' : html.toString();
    this.div.innerHTML = DOMPurify.sanitize(htmlString, this.DOMPurifyOptions);
  }

  componentDidMount() {
    this.sanitize();
  }

  componentDidUpdate() {
    this.sanitize();
  }

  render() {
    const { blockId, classNames, styles } = this.props;
    return (
      <div
        {...blockRootProps({ blockId, classNames, styles })}
        ref={(el) => {
          if (el) {
            this.div = el;
          }
        }}
      />
    );
  }
}

export default withBlockDefaults(DangerousHtml);
