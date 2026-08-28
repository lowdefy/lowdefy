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

import { serializer, type } from '@lowdefy/helpers';

import resolveDynamicContent from './dynamic/resolveDynamicContent.js';

// Returns a status object so the page route can fork on the auth outcome:
// - ok: render the page.
// - not_found and unauthorized both collapse to the opaque /404 redirect -
//   wrong roles never reveal that the page exists.
// - unauthenticated: a logged-out human gets the authPages.signIn redirect
//   with a callbackUrl back to the requested page.
// - enrol_required: an authorised caller who has not enrolled a second factor
//   under auth.twoFactor.required gets the authPages.twoFactorEnrol redirect.
//
// An unauthenticated caller never learns whether a page exists (Decision 7):
// in an app whose unlisted ids default to protected, a missing id answers
// unauthenticated, exactly as a protected one does. So in a protected app, a 404
// means you are signed in - and every app's 404 page stops needing to serve a
// signed-out visitor who was refused a protected page.
//
// The default is a build-resolved boolean, coarser than the glob lists that
// produced it on purpose: an id absent from the build could still match a
// declared pattern, and matching globs on the request path to change the answer
// for URLs that are wrong anyway is a cost the artifact exists to avoid.
async function getPageConfig(context, { pageId, urlQuery }) {
  const pageConfig = await context.readConfigFile(`pages/${pageId}.json`);
  if (!pageConfig) {
    if (type.isNone(context.user) && context.authEnforcement?.pagesProtectedByDefault === true) {
      return { status: 'unauthenticated' };
    }
    return { status: 'not_found' };
  }
  const outcome = context.authorizeOutcome(pageConfig, { pageId });
  if (outcome === 'allow') {
    // eslint-disable-next-line no-unused-vars
    const { auth, ...rest } = pageConfig;
    if (rest.dynamic !== true) {
      // Use serializer.serialize to ensure ~k keys (non-enumerable after deserialize)
      // are made enumerable again for JSON transfer to client
      return { status: 'ok', pageConfig: serializer.serialize(rest) };
    }
    // readConfigFile caches parsed artifacts — deep copy before resolution so
    // one request's resolved content never reaches another via the cache.
    const resolved = await resolveDynamicContent(context, {
      pageConfig: serializer.copy(rest),
      urlQuery,
    });
    return { status: 'ok', pageConfig: serializer.serialize(resolved) };
  }
  if (outcome === 'enrol_required') {
    return { status: 'enrol_required' };
  }
  if (type.isNone(context.user)) {
    return { status: 'unauthenticated' };
  }
  return { status: 'unauthorized' };
}

export default getPageConfig;
