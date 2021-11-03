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
import homeHtmlHandler from './homeHtml';
import openIdAuthorizationUrlHandler from './openIdAuthorizationUrl';
import openIdCallbackHandler from './openIdCallback';
import openIdLogoutUrlHandler from './openIdLogoutUrl';
import pageHtmlHandler from './pageHtml';
import pageConfigHandler from './pageConfig';
import requestHandler from './request';
import rootHandler from './root';

async function routes(fastify, { lowdefy }, done) {
  // This is done as an optimisation, the lowdefyContext object will be added in the preHandler hook
  fastify.decorateRequest('lowdefyContext', null);

  const { buildDirectory, connections, development, secrets, serveStaticFiles } = lowdefy;
  const contextFn = await createContext({ buildDirectory, connections, development, secrets });

  fastify.addHook('preHandler', (request, reply, done) => {
    request.lowdefyContext = contextFn({
      headers: request.headers,
      host: request.hostname,
      logger: request.log,
      protocol: request.protocol,
      setHeader: (key, value) => reply.header(key, value),
    });
    done();
  });

  if (serveStaticFiles) {
    fastify.get('/', homeHtmlHandler);
    fastify.get('/:pageId', pageHtmlHandler);
  }
  fastify.get('/lowdefy/page/:pageId', pageConfigHandler);
  fastify.post('/lowdefy/request/:pageId/:requestId', requestHandler);
  fastify.get('/lowdefy/root', rootHandler);
  fastify.get('/auth/openid-callback', openIdCallbackHandler);

  fastify.post('/lowdefy/auth/openIdAuthorizationUrl', openIdAuthorizationUrlHandler);
  fastify.post('/lowdefy/auth/openIdLogoutUrl', openIdLogoutUrlHandler);
  done();
}

export default routes;
