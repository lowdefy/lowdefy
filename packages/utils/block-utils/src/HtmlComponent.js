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

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { nunjucksFunction } from '@lowdefy/nunjucks';
import { type } from '@lowdefy/helpers';

const HtmlComponent = React.memo(
  ({
    data,
    div,
    events,
    html,
    id,
    methods,
    onClick = () => methods.triggerEvent({ name: 'onClick', event: { data } }),
    style,
    template,
  }) => {
    const memoizedHtml = useMemo(() => {
      let htmlContent = html?.toString() ?? '';
      if (type.isString(template)) {
        htmlContent = nunjucksFunction(template)(data);
      }
      return DOMPurify.sanitize(htmlContent);
    }, [html, template, JSON.stringify(data)]);

    if (memoizedHtml === '') return undefined; // do not render a element when so content is provided

    const onTextSelection = () => {
      if (events?.onTextSelection) {
        const selection = window.getSelection().toString();
        if (selection !== '') {
          methods.triggerEvent({
            name: 'onTextSelection',
            event: {
              selection,
            },
          });
        }
      }
    };

    const childProps = {
      'data-testid': id,
      className: methods.makeCssClass(style),
      dangerouslySetInnerHTML: { __html: memoizedHtml },
      id,
      onClick,
      onTextSelection,
      style,
    };
    if (div === true) {
      return <div {...childProps} />;
    }
    return <span {...childProps} />;
  }
);

export default HtmlComponent;
