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

// A view session lasts fifteen minutes from minting and is never extended: the
// view asks for a new one when it gets a 401. Short, because any holder of the
// MCP bearer can mint one.
const VIEW_SESSION_EXPIRES_IN = 15 * 60;

// The live view sessions one grant - a (client, user, organization) - holds.
// A view open in several places holds one each; minting past this ends the
// oldest.
const VIEW_SESSIONS_PER_GRANT = 20;

// The start of every view session token (mintViewSession). A view session's
// expiry is held fifteen minutes from minting while BetterAuth reads every
// session against auth.session.expiresIn, so each read of one would be due a
// refresh, a write of the session row. The caller resolution tells a view's
// bearer by this prefix and reads it without the refresh. BetterAuth's own
// tokens are letters and digits only, so none starts with it. It is a hint for
// that read and nothing else: what a session may do is told by its view mark.
const VIEW_SESSION_TOKEN_PREFIX = 'ldf_view_';

export { VIEW_SESSION_EXPIRES_IN, VIEW_SESSION_TOKEN_PREFIX, VIEW_SESSIONS_PER_GRANT };
