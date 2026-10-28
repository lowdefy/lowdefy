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

// The admin plugin's ban rule, as its session.create.before applies it: any truthy
// banned is a ban, and only a banExpires that reads as a past date lifts it. The
// truthiness checks are deliberate - a user this calls unbanned while the plugin
// refuses them would be sent an email the sign-in then rejects.
function isUserBanned({ user }) {
  if (!user.banned) {
    return false;
  }
  const expired = Boolean(user.banExpires) && new Date(user.banExpires).getTime() < Date.now();
  return !expired;
}

export default isUserBanned;
