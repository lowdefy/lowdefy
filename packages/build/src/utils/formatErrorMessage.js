/*
  Copyright 2020 Lowdefy, Inc

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

import { get, type } from '@lowdefy/helpers';
import getIdPath from './getIdPath';

function arrayReplacer(key, value) {
  if (type.isArray(value)) {
    return '_ARRAY_PLACEHOLDER_';
  }
  return value;
}

function formatErrorMessage(error, app) {
  const path = error.dataPath.substring(1).replace('[', '.').replace(']', '');
  return `--------- Schema Error ---------
message: ${error.message}
path: ${getIdPath(path, app)}
data:
${(JSON.stringify(get(app, path), arrayReplacer, 2) || '').replace(
  /"_ARRAY_PLACEHOLDER_"/g,
  '[...]'
)}
--------------------------------`;
}

export default formatErrorMessage;
