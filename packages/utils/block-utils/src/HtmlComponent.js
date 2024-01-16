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
import { type } from '@lowdefy/helpers';

class HtmlComponent extends React.Component {
  constructor(props) {
    super(props);
    this.div = {
      innerHTML: '',
    };
    this.onTextSelection = this.onTextSelection.bind(this);
  }

  componentDidMount() {
    const htmlString = type.isNone(this.props.html) ? '' : this.props.html.toString();
    this.div.innerHTML = DOMPurify.sanitize(htmlString);
  }

  componentDidUpdate() {
    const htmlString = type.isNone(this.props.html) ? '' : this.props.html.toString();
    this.div.innerHTML = DOMPurify.sanitize(htmlString);
  }

  onTextSelection() {
    if (this.props.events?.onTextSelection) {
      const selection = window.getSelection().toString();
      if (selection !== '') {
        this.props.methods.triggerEvent({
          name: 'onTextSelection',
          event: {
            selection,
          },
        });
      }
    }
  }
  render() {
    const { div, id, methods, style } = this.props;
    if (div === true) {
      return (
        <div
          id={id}
          data-testid={id}
          ref={(el) => {
            if (el) {
              this.div = el;
            }
          }}
          className={methods.makeCssClass(style)}
          onMouseUp={this.onTextSelection}
        />
      );
    }
    return (
      <span
        id={id}
        data-testid={id}
        ref={(el) => {
          if (el) {
            this.div = el;
          }
        }}
        className={methods.makeCssClass(style)}
        onMouseUp={this.onTextSelection}
      />
    );
  }
}

export default HtmlComponent;
