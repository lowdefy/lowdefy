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
import homeHtml from './homeHtml';
import openIdAuthorizationUrl from './openIdAuthorizationUrl';
import openIdCallback from './openIdCallback';
import openIdLogoutUrl from './openIdLogoutUrl';
import pageHtml from './pageHtml';
import pageConfig from './pageConfig';
import root from './root';

async function routes(fastify, { lowdefy }, done) {
  // This is done as an optimisation, the lowdefyContext object will be added in the preHandler hook
  fastify.decorateRequest('lowdefyContext', null);

  const { configDirectory, development, getSecrets, serveStaticFiles } = lowdefy;
  const contextFn = await createContext({ configDirectory, development, getSecrets });

  fastify.addHook('preHandler', (request, reply, done) => {
    request.lowdefyContext = contextFn({
      headers: {},
      host: '',
      setHeader: () => {},
    });
    done();
  });

  if (serveStaticFiles) {
    fastify.get('/', homeHtml);
    fastify.get('/:pageId', pageHtml);
  }
  fastify.get('/lowdefy/page/:pageId', pageConfig);
  fastify.get('/lowdefy/root', root);

  fastify.post('/lowdefy/auth/openIdAuthorizationUrl', openIdAuthorizationUrl);
  fastify.post('/lowdefy/auth/openIdCallback', openIdCallback);
  fastify.post('/lowdefy/auth/openIdLogoutUrl', openIdLogoutUrl);
  done();
}

export default routes;
