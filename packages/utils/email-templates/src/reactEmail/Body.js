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

// Derived from react-email 6.11.11 source:
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/body/body.tsx
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/body/margin-properties.ts
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/license.md
// Converted from TypeScript. React.forwardRef and the Tailwind element marker are left
// out; the rendered markup is the same.
//
// Copyright 2024 Plus Five Five, Inc
//
// This software is released under the MIT license:

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React from 'react';

const marginProperties = [
  'margin',
  'marginTop',
  'marginBottom',
  'marginRight',
  'marginLeft',
  'marginInline',
  'marginBlock',
  'marginBlockStart',
  'marginBlockEnd',
  'marginInlineStart',
  'marginInlineEnd',
];

const paddingProperties = [
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingRight',
  'paddingLeft',
  'paddingInline',
  'paddingBlock',
  'paddingBlockStart',
  'paddingBlockEnd',
  'paddingInlineStart',
  'paddingInlineEnd',
];

function Body({ children, style, ...props }) {
  const bodyStyle = {
    background: style?.background,
    backgroundColor: style?.backgroundColor,
  };
  if (style) {
    for (const property of [...marginProperties, ...paddingProperties]) {
      // We reset the margin if the user sets it, this mimics the
      // same behavior that would happen if this was only using the body.
      // This avoids the incoming margin summing up with the margin
      // defined by the email client on the body, or by the browser itself
      bodyStyle[property] = style[property] !== undefined ? 0 : undefined;
    }
  }
  return (
    <body {...props} dir={props.dir ?? 'ltr'} lang={props.lang ?? 'en'} style={bodyStyle}>
      <table
        border={0}
        width="100%"
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        align="center"
      >
        <tbody>
          <tr>
            {/*
              Yahoo and AOL remove all styles of the body element while converting it to a div,
              so we need to apply them to to an inner cell.

              See https://github.com/resend/react-email/issues/662.
            */}
            <td dir={props.dir ?? 'ltr'} lang={props.lang ?? 'en'} style={style}>
              {children}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
  );
}

export default Body;
