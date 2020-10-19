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

import { get } from '@lowdefy/helpers';

function getRemovedObjects({ oldObjects = [], newObjects = [], objectId }) {
  let id;
  if (objectId) {
    id = objectId;
  } else {
    id = 'id';
  }
  return oldObjects.filter((oldObject) => {
    if (!oldObject) {
      return false;
    }
    if (
      newObjects.find(
        (object) => get(object, id, { default: 'n' }) === get(oldObject, id, { default: 'o' })
      )
    ) {
      return false;
    }
    return true;
  });
}

export default getRemovedObjects;
