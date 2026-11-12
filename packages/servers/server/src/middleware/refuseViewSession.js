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

// A view session is the bearer session an MCP App view signs in with
// (context.viewSession, set by resolveAuthentication). It carries the person's
// roles, so it is refused on every /api route that has not opted in with
// admitViewSession: a route added later is closed to views until it is listed
// in viewRoutes. Registered on /api/* after apiContext, which resolves the
// caller, and before every route handler.
//
// /api/auth resolves no caller here (BetterAuth reads the session itself), so
// a view session is refused there inside the auth engine.
function refuseViewSession() {
  return function refuseViewSessionMiddleware(c, next) {
    const context = c.get('lowdefyContext');
    if (type.isNone(context.viewSession) || c.get('viewSessionAdmitted') === true) {
      return next();
    }
    context.logger.warn({ event: 'view_session_refused', path: c.req.path });
    return c.json(
      { name: 'AuthorizationError', message: 'A view session cannot call this route.' },
      403
    );
  };
}

export default refuseViewSession;
