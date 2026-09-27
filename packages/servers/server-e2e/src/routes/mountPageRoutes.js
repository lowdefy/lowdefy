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

// Every page path renders the app shell with its page id. `.*`, not `.+`: under
// a basePath, `<basePath>/` arrives with an empty rest, and is the app root
// like `<basePath>` itself.
function mountPageRoutes({ app, renderPage }) {
  app.get('/', (c) => renderPage(c, { pageId: '' }));
  app.get('/404', (c) => renderPage(c, { pageId: '404', status: 404 }));
  app.get('/:rest{.*}', (c) => renderPage(c, { pageId: c.req.param('rest') }));
}

export default mountPageRoutes;
