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

// The evidence a PASS line carries: `412 sessions · 9 orgs · 11/12 mutants`.
// Orgs are left out when the app sends none, mutants when no mutation report
// has been refreshed into the journey. Empty when there is nothing to show.
function formatEvidence({ evidence }) {
  if (!type.isObject(evidence)) return '';
  const parts = [];
  const { production, mutation } = evidence;
  if (type.isObject(production)) {
    if (production.sessions === 0) {
      parts.push('0 sessions in window');
    } else {
      parts.push(`${production.sessions} sessions`);
    }
    if (production.orgs > 0) {
      parts.push(`${production.orgs} orgs`);
    }
  }
  if (type.isObject(mutation)) {
    parts.push(`${mutation.killed}/${mutation.total} mutants`);
  }
  return parts.join(' · ');
}

export default formatEvidence;
