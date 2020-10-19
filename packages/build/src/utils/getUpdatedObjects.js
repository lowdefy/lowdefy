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

import util from 'util';
import { get } from '@lowdefy/helpers';

function getUpdatedObjects({ oldObjects = [], newObjects = [], objectId }) {
  let id;
  if (objectId) {
    id = objectId;
  } else {
    id = 'id';
  }
  return newObjects.filter((newObject) => {
    if (!newObject) {
      return false;
    }
    const oldObject = oldObjects.find(
      (object) => get(object, id, { default: 'o' }) === get(newObject, id, { default: 'n' })
    );
    return !util.isDeepStrictEqual(oldObject, newObject);
  });
}

export default getUpdatedObjects;
