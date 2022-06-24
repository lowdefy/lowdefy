/*
  Copyright 2020-2022 Lowdefy, Inc

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

import request from './request.js';

const MAX_COUNT = 1200; // 10 mins

function waitForRestartedServer(basePath) {
  let count = 0;
  setTimeout(async () => {
    try {
      await request({
        url: `${basePath}/api/ping`,
      });
      window.location.reload();
    } catch (error) {
      count += 1;
      if (count <= MAX_COUNT) {
        waitForRestartedServer(basePath);
      }
    }
  }, 500); // TODO: this ping should be shorter than rerender delay until we can pass a rebuild flag to reload.
}

export default waitForRestartedServer;
