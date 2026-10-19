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

// Refuses a request or endpoint call from a tab running another build, before
// anything runs. The old page's payload may be the wrong shape for the new
// build's request and still be written, so a call that cannot be trusted is
// stopped here rather than detected on its response. The client reloads once
// onto the current build (@lowdefy/client request.js); a call that names no
// build (a third-party webhook, a page from before this check) runs as before.
// UserError is an expected outcome: if the reload guard has already fired the
// client shows the message without reporting it as a fault.
function refuseOtherBuild({ buildId }) {
  return async function refuseOtherBuildMiddleware(c, next) {
    const callerBuildId = c.req.header('x-lowdefy-build');
    if (type.isNone(callerBuildId) || callerBuildId === buildId) {
      return next();
    }
    c.get('lowdefyContext').logger.info({
      event: 'refused_other_build',
      path: c.req.path,
      callerBuildId,
    });
    return c.json(
      {
        name: 'UserError',
        message: 'This page is from an earlier version of the app. Reload the page to continue.',
        buildId,
      },
      409
    );
  };
}

export default refuseOtherBuild;
