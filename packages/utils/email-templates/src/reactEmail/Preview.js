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
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/preview/preview.tsx
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

const PREVIEW_MAX_LENGTH = 200;

// Spam filters such as rspamd ignore these as preview padding, but count the
// direction marks U+200E and U+200F as hidden text, so those are left out.
const whiteSpaceCodes = '\xa0‌​‍﻿';

function renderWhiteSpace(text) {
  if (text.length >= PREVIEW_MAX_LENGTH) {
    return null;
  }

  return <div>{whiteSpaceCodes.repeat(PREVIEW_MAX_LENGTH - text.length)}</div>;
}

function Preview({ children = '', useTitleTag = true, ...props }) {
  const text = (Array.isArray(children) ? children.join('') : children).substring(
    0,
    PREVIEW_MAX_LENGTH
  );

  return (
    <>
      {useTitleTag ? <title>{text}</title> : null}
      <div
        style={{
          display: 'none',
          overflow: 'hidden',
          lineHeight: '1px',
          opacity: 0,
          maxHeight: 0,
          maxWidth: 0,
        }}
        data-skip-in-text={true}
        {...props}
      >
        {text}
        {renderWhiteSpace(text)}
      </div>
    </>
  );
}

export default Preview;
