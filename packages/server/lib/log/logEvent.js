/*
  Copyright 2020-2023 Lowdefy, Inc

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

function logEvent({ context, event, pageId, requestId }) {
  const { headers = {}, user = {} } = context;

  context.logger.info({
    event,
    // TODO:
    // app_name
    // app_version
    // lowdefy_version
    // build_hash
    // config_hash
    page_id: pageId,
    request_id: requestId,
    user: {
      id: user.id,
      roles: user.roles,
      sub: user.sub,
      session_id: user.session_id, // TODO: Implement session id
    },
    headers: {
      'accept-language': headers['accept-language'],
      'sec-ch-ua-mobile': headers['sec-ch-ua-mobile'],
      'sec-ch-ua-platform': headers['sec-ch-ua-platform'],
      'sec-ch-ua': headers['sec-ch-ua'],
      'user-agent': headers['user-agent'],
      host: headers.host,
      referer: headers.referer,
      // Non localhost headers
      'x-forward-for': headers['x-forward-for'],
      // Vercel headers
      'x-vercel-id': headers['x-vercel-id'],
      'x-real-ip': headers['x-real-ip'],
      'x-vercel-ip-country': headers['x-vercel-ip-country'],
      'x-vercel-ip-country-region': headers['x-vercel-ip-country-region'],
      'x-vercel-ip-city': headers['x-vercel-ip-city'],
      'x-vercel-ip-latitude': headers['x-vercel-ip-latitude'],
      'x-vercel-ip-longitude': headers['x-vercel-ip-longitude'],
      'x-vercel-ip-timezone': headers['x-vercel-ip-timezone'],
      // TODO: Cloudflare headers
      'cf-connecting-ip': headers['cf-connecting-ip'],
      'cf-ray': headers['cf-ray'],
      'cf-ipcountry': headers['cf-ipcountry'],
      'cf-visitor': headers['cf-visitor'],
    },
  });
  // TODO:
  // Next local? nextContext.locale, nextContext.locales, nextContext.defaultLocale
  // console.log('url', nextContext.req?.url);
  // console.log('method', nextContext.req?.method);
  // console.log('hostname', nextContext.req?.hostname);
  // console.log('resolvedUrl', nextContext.resolvedUrl);
  // console.log('params', nextContext.params);
  // console.log('context', context);
  // console.log('nextContext', nextContext);
}

export default logEvent;
