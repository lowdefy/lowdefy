/*
  Copyright 2020-2024 Lowdefy, Inc

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

function js(operatorContext) {
  const { jsMap, operators, location, params } = operatorContext;
  try {
    return jsMap[params.hash]({
      actions: (params) => operators._actions({ ...operatorContext, params }),
      event: (params) => operators._event({ ...operatorContext, params }),
      input: (params) => operators._input({ ...operatorContext, params }),
      location: (params) => operators._location({ ...operatorContext, params }),
      lowdefyGlobal: (params) => operators._global({ ...operatorContext, params }),
      request: (params) => operators._request({ ...operatorContext, params }),
      state: (params) => operators._state({ ...operatorContext, params }),
      urlQuery: (params) => operators._url_query({ ...operatorContext, params }),
      user: (params) => operators._user({ ...operatorContext, params }),
    });
  } catch (error) {
    throw new Error(
      `Operator Error: ${error.message} at ${location}. Received function: ${jsMap[
        params.hash
      ].toString()}`
    );
  }
}

export default js;
