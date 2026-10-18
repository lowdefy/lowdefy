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

import { type } from '@lowdefy/helpers';

// The stock sign-in email (EmailOTPEmail in @lowdefy/email-templates) puts the
// one-time code on a line of its own, and so does any template that shows a
// code to copy. A number inside a sentence (an order or invoice number) is not
// taken for one.
const CODE_LINE = /^[ \t]*(\d{4,10})[ \t]*$/m;

function findSignInCode({ text }) {
  if (!type.isString(text)) {
    return null;
  }
  const match = text.match(CODE_LINE);
  return match === null ? null : match[1];
}

export default findSignInCode;
