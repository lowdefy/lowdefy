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

// A properties schema entry for each key that fails whenever the key is present.
function createRefusedPropertiesSchema({ keys, reason }) {
  return Object.fromEntries(
    keys.map((key) => [
      key,
      {
        not: {},
        errorMessage: `AxiosHttp property "${key}" ${reason}`,
      },
    ])
  );
}

export default createRefusedPropertiesSchema;
