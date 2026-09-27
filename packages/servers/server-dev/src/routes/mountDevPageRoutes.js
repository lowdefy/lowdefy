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

// Every page path renders the same dev shell; the client reads the page from
// the URL. `.*`, not `.+`: under a basePath, `<basePath>/` arrives with an
// empty rest, and is the app root like `<basePath>` itself.
function mountDevPageRoutes({ app, renderPage }) {
  app.get('/', renderPage);
  app.get('/:rest{.*}', renderPage);
}

export default mountDevPageRoutes;
