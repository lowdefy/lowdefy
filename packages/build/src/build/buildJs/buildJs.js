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

import jsMapParser from './jsMapParser.js';

function buildJs({ components, context }) {
  components.pages = components.pages.map((page) => {
    const pageRequests = [...page.requests];
    delete page.requests;
    const cleanPage = jsMapParser({ input: page, jsMap: context.jsMap, env: 'client' });
    const cleanRequests = jsMapParser({ input: pageRequests, jsMap: context.jsMap, env: 'server' });
    return { ...cleanPage, requests: cleanRequests };
  });
  components.connections = jsMapParser({
    input: components.connections,
    jsMap: context.jsMap,
    env: 'server',
  });
}

export default buildJs;
