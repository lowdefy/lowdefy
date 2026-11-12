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

// Wraps the static file middleware for an app with an MCP App view. A view
// loads the client's module scripts, stylesheets and fonts from the host's
// origin, and a browser loads those across origins only when the response
// allows it. The files are public and the same for every caller, so any
// origin may read them.
//
// Only a file the wrapped middleware answers itself gets the header. When no
// file matches it calls next(), and the page route's response is left as it is.
function allowAnyOrigin(staticMiddleware) {
  return async function allowAnyOriginMiddleware(c, next) {
    let served = true;
    const response = await staticMiddleware(c, () => {
      served = false;
      return next();
    });
    if (served && response instanceof Response) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    return response;
  };
}

export default allowAnyOrigin;
