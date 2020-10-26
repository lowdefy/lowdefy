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

import path from 'path';

async function loadModule(dir, moduleName, remoteEntry = 'remoteEntry.js') {
  const importRemote = async (remoteEntryFile) => {
    if (__webpack_share_scopes__.default) {
      await __webpack_init_sharing__('default');
    }

    return new Promise((remoteResolve) => {
      const container = __non_webpack_require__(remoteEntryFile);
      const initContainer = new Promise((containerResolve) => {
        if (__webpack_share_scopes__.default) {
          containerResolve(container.init(__webpack_share_scopes__.default));
        } else {
          containerResolve();
        }
      });
      initContainer.then(() => {
        remoteResolve(container);
      });
    });
  };

  const container = await importRemote(path.resolve(`${dir}/${remoteEntry}`));

  return container.get(moduleName).then((factory) => factory());
}

export default loadModule;
