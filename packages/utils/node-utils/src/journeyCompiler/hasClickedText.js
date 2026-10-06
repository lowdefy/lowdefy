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

// Whether a click target showed text: config text a production reader
// resolved, the developer's own text in a recording, or a production
// clicked-text token that resolved to no config string. A token is text the
// element showed, so a click carrying one is labelled even without the words.
function hasClickedText({ target }) {
  if (type.isString(target?.text) && target.text !== '') return true;
  return type.isString(target?.text_token) && target.text_token !== '';
}

export default hasClickedText;
