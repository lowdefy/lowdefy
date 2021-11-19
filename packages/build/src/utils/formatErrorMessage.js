/*
  Copyright 2020-2021 Lowdefy, Inc

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

function formatArrayKey({ index, object }) {
  if (!type.isNone(object.id) || !type.isNone(object.type)) {
    const objectId = type.isNone(object.id) ? '_ERROR_MISSING_ID_' : object.id;
    const objectType = type.isNone(object.type) ? '_ERROR_MISSING_TYPE_' : object.type;
    return `[${index}:${objectId}:${objectType}]`;
  }
  return `[${index}]`;
}

function recursiveFormatPath({ data, dataPath, formattedPath = '', gap = '', root = false }) {
  if (dataPath.length === 0) return formattedPath;
  const key = dataPath.shift();
  const newData = get(data, key);
  let newPath;
  if (type.isArray(data)) {
    gap += ' ';
    newPath = `${formattedPath}
${gap}- ${formatArrayKey({ index: key, object: newData })}`;
  } else {
    newPath = `${formattedPath}${root ? '- ' : '.'}${key}`;
  }
  return recursiveFormatPath({ data: newData, dataPath, formattedPath: newPath, gap });
}

function formatErrorMessage({ error, components }) {
  const formattedPath = recursiveFormatPath({
    data: components,
    dataPath: error.dataPath.split('/').slice(1),
    root: true,
  });
  return `Schema Error
${error.message}
${formattedPath}`;
}

export default formatErrorMessage;
