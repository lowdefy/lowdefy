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
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/text/text.tsx
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

import computeMargins from './computeMargins.js';

function Text({ style, ...props }) {
  // we do this clunky way of spreading these default margins because
  // if we were to simply spread, the ordering of the margins would be lost
  //
  // ex:
  // { ...{ marginTop: '16px', marginBottom: '16px' }, ...{ marginTop: '24px' } }
  // // would result in
  // { marginTop: '24px', marginBottom: '16px' }
  // // not the expected
  // { marginBottom: '16px', marginTop: '24px' }
  const defaultMargins = {};
  if (style?.marginTop === undefined) {
    defaultMargins.marginTop = '16px';
  }
  if (style?.marginBottom === undefined) {
    defaultMargins.marginBottom = '16px';
  }
  const margins = computeMargins({
    ...defaultMargins,
    ...style,
  });

  return (
    <p
      {...props}
      style={{
        fontSize: '14px',
        lineHeight: '24px',
        ...style,
        ...margins,
      }}
    />
  );
}

export default Text;
