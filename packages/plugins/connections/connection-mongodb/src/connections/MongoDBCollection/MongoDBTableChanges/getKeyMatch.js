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

import getKeyForms from './getKeyForms.js';

// The match value of a row key in a filter or an array filter: the key itself, or $in of its
// forms. Every form is a scalar, so a key can never widen the match.
function getKeyMatch({ key, rowKeyType }) {
  const forms = getKeyForms({ key, rowKeyType });
  return forms.length === 1 ? forms[0] : { $in: forms };
}

export default getKeyMatch;
