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

import { createContext } from '@lowdefy/api';
import page from './page';
import root from './root';

async function routes(fastify, { lowdefy }, done) {
  // This is done as an optimisation, the lowdefyContext object will be added in the preHandler hook
  fastify.decorateRequest('lowdefyContext', null);

  const { apiPath, configDirectory, development, getSecrets } = lowdefy;
  const contextFn = await createContext({ apiPath, configDirectory, development, getSecrets });

  fastify.addHook('preHandler', (request, reply, done) => {
    request.lowdefyContext = contextFn({
      headers: {},
      host: '',
      setHeader: () => {},
    });
    done();
  });

  fastify.get('/page/:pageId', page);
  fastify.get('/root', root);
  done();
}

export default routes;
