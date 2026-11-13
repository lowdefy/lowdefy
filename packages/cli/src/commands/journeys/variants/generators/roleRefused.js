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

import { type } from '@lowdefy/helpers';

import stepTarget, { targetBlockId } from '../stepTarget.js';

// The call-based form: a page-less journey in which the refused user calls each request of the
// start page the journey's measured run called, and is refused as the request's auth answers a
// caller with other roles (403). It runs headless, so a negative request suite is generated
// rather than written.
function refusedCalls({ exercised, journey, name }) {
  const requests = (exercised?.requests ?? []).filter(({ pageId }) => pageId === journey.pageId);
  if (requests.length === 0) {
    return [];
  }
  return [
    {
      kind: 'role',
      detail: `requests refused to ${name}`,
      overrides: { user: name, pageId: undefined, pathParams: undefined, urlQuery: undefined },
      steps: requests.flatMap(({ pageId, requestId }) => [
        { request: { pageId, requestId, payload: {} } },
        { expect: { status: 403 } },
      ]),
    },
  ];
}

// Role, refused: when the start page's built config has auth.roles and a
// data set user holds none of them, that user opens the page, is sent to
// /404 (the server collapses an unauthorized page to it), and does not see
// the first block the journey targets. The /404 check comes first, because
// expect.hidden alone also passes on a page that never loaded. With a
// measured run, the requests of the page it called are refused to that user
// too (refusedCalls). Neither form is written when the app keeps an access
// table snapshot (role-refused-calls-without-snapshot): the snapshot already
// answers who reaches the page, and its requests share the page's gate.
function roleRefused({ journey, dataSet, exercised, pageConfigs, accessSnapshot }) {
  if (!type.isNone(accessSnapshot)) {
    return {
      skipped: `the access table snapshot (${accessSnapshot}) already answers who reaches page "${journey.pageId}"`,
    };
  }
  if (type.isNone(dataSet)) {
    return { skipped: 'the journey declares no data: set' };
  }
  const pageRoles = pageConfigs[0]?.auth?.roles;
  if (!type.isArray(pageRoles) || pageRoles.length === 0) {
    return { skipped: `page "${journey.pageId}" has no auth.roles` };
  }
  const name = Object.keys(dataSet.users)
    .sort()
    .find((userName) =>
      (dataSet.users[userName].roles ?? []).every((role) => !pageRoles.includes(role))
    );
  if (type.isUndefined(name)) {
    return {
      skipped: `every data set user holds one of the page roles [${pageRoles.join(
        ', '
      )}]: add one who holds none`,
    };
  }
  const blockId = journey.steps
    .map((step) => targetBlockId(stepTarget(step)))
    .find((candidate) => !type.isNull(candidate));
  if (type.isUndefined(blockId)) {
    return { skipped: 'the journey targets no block' };
  }
  return [
    {
      kind: 'role',
      detail: `refused to ${name}`,
      overrides: { user: name },
      steps: [{ expect: { url: { contains: '/404' } } }, { expect: { hidden: blockId } }],
    },
    ...refusedCalls({ exercised, journey, name }),
  ];
}

export default roleRefused;
