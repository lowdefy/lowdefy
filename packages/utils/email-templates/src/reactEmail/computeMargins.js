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
// https://github.com/resend/react-email/blob/react-email%406.11.11/packages/react-email/src/components/text/utils/compute-margins.ts
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

function parseMarginValue(value) {
  if (typeof value === 'number')
    return {
      marginTop: value,
      marginBottom: value,
      marginLeft: value,
      marginRight: value,
    };

  if (typeof value === 'string') {
    const values = value.toString().trim().split(/\s+/);

    if (values.length === 1) {
      return {
        marginTop: values[0],
        marginBottom: values[0],
        marginLeft: values[0],
        marginRight: values[0],
      };
    }

    if (values.length === 2) {
      return {
        marginTop: values[0],
        marginRight: values[1],
        marginBottom: values[0],
        marginLeft: values[1],
      };
    }

    if (values.length === 3) {
      return {
        marginTop: values[0],
        marginRight: values[1],
        marginBottom: values[2],
        marginLeft: values[1],
      };
    }

    if (values.length === 4) {
      return {
        marginTop: values[0],
        marginRight: values[1],
        marginBottom: values[2],
        marginLeft: values[3],
      };
    }
  }

  return {
    marginTop: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
    marginRight: undefined,
  };
}

// Parses all the values out of a margin string to get the value for all margin props in the four
// margin properties, for example "10px" => mt: "10px", mr: "10px", mb: "10px", ml: "10px".
function computeMargins(properties) {
  let result = {
    marginTop: undefined,
    marginRight: undefined,
    marginBottom: undefined,
    marginLeft: undefined,
  };

  for (const [key, value] of Object.entries(properties)) {
    if (key === 'margin') {
      result = parseMarginValue(value);
    } else if (key === 'marginTop') {
      result.marginTop = value;
    } else if (key === 'marginRight') {
      result.marginRight = value;
    } else if (key === 'marginBottom') {
      result.marginBottom = value;
    } else if (key === 'marginLeft') {
      result.marginLeft = value;
    }
  }

  return result;
}

export default computeMargins;
