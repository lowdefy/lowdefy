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

import { homePageId, openIdCallback, AuthenticationError } from '@lowdefy/api';

async function openIdCallbackHandler(request, reply) {
  try {
    const { code, state, error, error_description } = request.query;

    if (error) {
      if (error_description) throw new AuthenticationError(error_description);
      throw new AuthenticationError(error);
    }

    if (!code || !state) throw new AuthenticationError('Authentication error.');

    // Authentication an idToken cookies are set by openIdCallback function.
    let {
      pageId,
      //urlQuery
    } = await openIdCallback(request.lowdefyContext, {
      code,
      state,
    });

    if (!pageId) {
      pageId = await homePageId(request.lowdefyContext);
    }

    // TODO: Need to set urlQuery;

    reply.redirect(`/${pageId}`);
  } catch (error) {
    console.log(error);
    console.log(error.message);
    console.log(error.stack);
    reply.type('text/html');
    reply.send(`<h1>Error</h1><h4>${error.message}</h4>`);
  }
}

export default openIdCallbackHandler;
