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

// A member row admits its holder only while it is not suspended. member.suspended
// is how an app takes someone out of one organization without banning their
// login (which covers every organization in the deployment) and without
// deleting the row, so the row - and the roles on it - stays readable to the
// app's own queries. Every check that asks whether a person belongs to an
// organization asks this, so a suspended member gets the outcome a non-member
// gets.
function isActiveMember({ member }) {
  return !type.isNone(member) && member.suspended !== true;
}

export default isActiveMember;
