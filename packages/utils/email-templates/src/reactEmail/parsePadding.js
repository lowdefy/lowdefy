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
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/button/utils/parse-padding.ts
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/license.md
// Converted from TypeScript.
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

// Converts a padding value to its `px` equivalent, for example "1em" => 16.
function convertToPx(value) {
  let px;

  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const matches = /^([\d.]+)(px|pt|em|rem|%)$/.exec(value);

  if (matches && matches.length === 3) {
    const numValue = Number.parseFloat(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 'px':
        return numValue;
      case 'pt':
        return (numValue * 4) / 3;
      case 'em':
      case 'rem':
        px = numValue * 16;
        return px;
      case '%':
        px = (numValue / 100) * 600;
        return px;
      default:
        return numValue;
    }
  }
  return 0;
}

function parsePaddingValue(value) {
  if (typeof value === 'number')
    return {
      paddingTop: value,
      paddingBottom: value,
      paddingLeft: value,
      paddingRight: value,
    };

  if (typeof value === 'string') {
    const values = value.toString().trim().split(/\s+/);

    if (values.length === 1) {
      return {
        paddingTop: values[0],
        paddingBottom: values[0],
        paddingLeft: values[0],
        paddingRight: values[0],
      };
    }

    if (values.length === 2) {
      return {
        paddingTop: values[0],
        paddingRight: values[1],
        paddingBottom: values[0],
        paddingLeft: values[1],
      };
    }

    if (values.length === 3) {
      return {
        paddingTop: values[0],
        paddingRight: values[1],
        paddingBottom: values[2],
        paddingLeft: values[1],
      };
    }

    if (values.length === 4) {
      return {
        paddingTop: values[0],
        paddingRight: values[1],
        paddingBottom: values[2],
        paddingLeft: values[3],
      };
    }
  }

  return {
    paddingTop: undefined,
    paddingBottom: undefined,
    paddingLeft: undefined,
    paddingRight: undefined,
  };
}

// Parses all the values out of a padding string to get the value for all padding props in `px`,
// for example "10px" => pt: 10, pr: 10, pb: 10, pl: 10.
function parsePadding(properties) {
  let paddingTop;
  let paddingRight;
  let paddingBottom;
  let paddingLeft;

  for (const [key, value] of Object.entries(properties)) {
    if (key === 'padding') {
      ({ paddingTop, paddingBottom, paddingLeft, paddingRight } = parsePaddingValue(value));
    } else if (key === 'paddingTop') {
      paddingTop = value;
    } else if (key === 'paddingRight') {
      paddingRight = value;
    } else if (key === 'paddingBottom') {
      paddingBottom = value;
    } else if (key === 'paddingLeft') {
      paddingLeft = value;
    }
  }

  return {
    paddingTop: convertToPx(paddingTop),
    paddingRight: convertToPx(paddingRight),
    paddingBottom: convertToPx(paddingBottom),
    paddingLeft: convertToPx(paddingLeft),
  };
}

export default parsePadding;
