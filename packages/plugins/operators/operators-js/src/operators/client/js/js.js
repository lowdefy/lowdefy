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
    return jsMap[params]({
      actions: (p) => operators._actions({ ...operatorContext, params: p }),
      event: (p) => operators._event({ ...operatorContext, params: p }),
      input: (p) => operators._input({ ...operatorContext, params: p }),
      location: (p) => operators._location({ ...operatorContext, params: p }),
      lowdefyGlobal: (p) => operators._global({ ...operatorContext, params: p }),
      request: (p) => operators._request({ ...operatorContext, params: p }),
      state: (p) => operators._state({ ...operatorContext, params: p }),
      urlQuery: (p) => operators._url_query({ ...operatorContext, params: p }),
      user: (p) => operators._user({ ...operatorContext, params: p }),
    });
  } catch (error) {
    throw new Error(
      `Operator Error: ${error.message} at ${location}. Received function: ${jsMap[
        params
      ].toString()}`
    );
  }
}

export default js;
