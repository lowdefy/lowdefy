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
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/button/button.tsx
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

import parsePadding from './parsePadding.js';
import pxToPt from './pxToPt.js';

const maxFontWidth = 5;

// Computes a msoFontWidth <= 5 and a count of space characters that,
// when applied, end up being as close to `expectedWidth` as possible.
function computeFontWidthAndSpaceCount(expectedWidth) {
  if (expectedWidth === 0) return [0, 0];

  let smallestSpaceCount = 0;

  const computeRequiredFontWidth = () => {
    if (smallestSpaceCount > 0) {
      return expectedWidth / smallestSpaceCount / 2;
    }

    return Number.POSITIVE_INFINITY;
  };

  while (computeRequiredFontWidth() > maxFontWidth) {
    smallestSpaceCount++;
  }

  return [computeRequiredFontWidth(), smallestSpaceCount];
}

function Button({ children, style, target = '_blank', ...props }) {
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style ?? {});

  const y = (paddingTop ?? 0) + (paddingBottom ?? 0);
  const textRaise = pxToPt(y);

  const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft ?? 0);
  const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight ?? 0);

  return (
    <a
      {...props}
      style={{
        lineHeight: '100%',
        textDecoration: 'none',
        display: 'inline-block',
        maxWidth: '100%',
        msoPaddingAlt: '0px',
        ...style,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
      }}
      target={target}
    >
      <span
        dangerouslySetInnerHTML={{
          // The `&#8202;` is as close to `1px` of an empty character as we can get, then, we use the `mso-font-width`
          // to scale it according to what padding the developer wants. `mso-font-width` also does not allow for percentages
          // >= 500% so we need to add extra spaces accordingly.
          //
          // See https://github.com/resend/react-email/issues/1512 for why we do not use letter-spacing instead.
          __html: `<!--[if mso]><i style="mso-font-width:${
            plFontWidth * 100
          }%;mso-text-raise:${textRaise}px" hidden>${'&#8202;'.repeat(
            plSpaceCount
          )}</i><![endif]-->`,
        }}
      />
      <span
        style={{
          maxWidth: '100%',
          display: 'inline-block',
          lineHeight: '120%',
          msoPaddingAlt: '0px',
          msoTextRaise: pxToPt(paddingBottom),
        }}
      >
        {children}
      </span>
      <span
        dangerouslySetInnerHTML={{
          __html: `<!--[if mso]><i style="mso-font-width:${
            prFontWidth * 100
          }%" hidden>${'&#8202;'.repeat(prSpaceCount)}&#8203;</i><![endif]-->`,
        }}
      />
    </a>
  );
}

export default Button;
