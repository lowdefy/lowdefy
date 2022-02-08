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

function getConfigFromEnv() {
  return {
    buildDirectory: process.env.LOWDEFY_SERVER_BUILD_DIRECTORY,
    logLevel: process.env.LOWDEFY_SERVER_LOG_LEVEL,
    publicDirectory: process.env.LOWDEFY_SERVER_PUBLIC_DIRECTORY,
    port: process.env.LOWDEFY_SERVER_PORT && parseInt(process.env.LOWDEFY_SERVER_PORT),
    basePath: process.env.LOWDEFY_BASE_PATH,
  };
}

export default getConfigFromEnv;
