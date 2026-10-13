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

import { appStorageKey } from '@lowdefy/helpers';

// A person's data sits under one name in the app's namespace, then the owner's user id. Keys set
// with SetLocalStorage can not start with "lowdefy_", so no app key reads as a user key.
function userStoragePrefix({ basePath, slug }) {
  return appStorageKey({ basePath, name: 'lowdefy_user:', slug });
}

export default userStoragePrefix;
