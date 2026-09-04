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

// Decides whether the affordance is offered, not whether a report is accepted:
// /api/feedback runs the same gate against the session on the server. Empty
// roles means any signed-in user, matching config.feedback.roles.
function isFeedbackAllowed({ feedback, user }) {
  if (feedback?.enabled !== true) return false;
  if (type.isNone(user)) return false;
  const required = feedback.roles ?? [];
  if (!type.isArray(required) || required.length === 0) return true;
  const held = user.roles ?? [];
  return required.some((role) => held.includes(role));
}

export default isFeedbackAllowed;
