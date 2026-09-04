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

import logEvent from '../../log/logEvent.js';
import resolveEventPolicy from '../../log/resolveEventPolicy.js';
import validateFeedbackReport from './validateFeedbackReport.js';

// A feedback report is a signed statement by a named user, not a diagnostic
// sample: it is always info and always carries the reporter, whatever
// logger.events says about the request lines around it.
function pinPolicyToSignedInfo(context) {
  const { logger } = context;
  return {
    ...context,
    logger: {
      debug: (...args) => logger.debug(...args),
      eventsConfig: { ...resolveEventPolicy(logger.eventsConfig), identity: true, level: 'all' },
      info: (...args) => logger.info(...args),
    },
  };
}

// Empty `roles` means any authenticated user, so the role list is left off the
// auth object rather than passed as []: an empty auth.roles denies everyone
// (createAuthorizeOutcome - empty roles is not a wall).
function isAllowed({ context, roles }) {
  const auth = { public: false };
  if (type.isArray(roles) && roles.length > 0) {
    auth.roles = roles;
  }
  return context.authorizeOutcome({ auth }) === 'allow';
}

// One `feedback_submitted` wide event per report. The report carries the
// journey session_id the tab is recording under, which is what turns "this is
// broken" into a reproduction: lowdefy_prod_trace({ session_id }) pulls the
// journey_event lines of the same session, in order, up to the report.
function logFeedbackReport(context, { feedback, report }) {
  if (feedback?.enabled !== true) {
    return { status: 'disabled' };
  }
  if (!isAllowed({ context, roles: feedback.roles })) {
    return { status: 'forbidden' };
  }
  const validation = validateFeedbackReport(report);
  if (validation.valid === false) {
    return { message: validation.message, status: 'invalid' };
  }

  logEvent({
    context: pinPolicyToSignedInfo(context),
    event: 'feedback_submitted',
    fields: {
      text: report.text,
      page_id: report.page_id,
      block_id: report.block_id ?? null,
      url: report.url ?? null,
      session_id: report.session_id ?? null,
      screenshot: report.screenshot ?? null,
      org: context.user?.organization_id,
    },
  });

  return { status: 'ok' };
}

export default logFeedbackReport;
