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

import crypto from 'node:crypto';

// Signs every journey cookie (journeyCookies.js): the headless renderer
// (getBrowser.js) writes them on a journey actor's browser context, and the dev
// server reads them back (getClientAddress.js for the actor address).
//
// Auth rate limits count attempts per client address, and every actor of every
// journey reaches the dev server from the same machine, so each actor is given
// its own address. The cookie carries it with a token minted once per dev
// server process, so only the dev server's own headless browser can pick an
// address: a cookie from anywhere else is ignored. The production server never
// reads it. The token is kept on globalThis because the renderer and the
// resolver may load as separate module instances in one process (Vite's SSR
// module graph and Node's).
const TOKEN_KEY = Symbol.for('lowdefy.devServer.journeyActorToken');
globalThis[TOKEN_KEY] ??= crypto.randomBytes(32).toString('hex');
const journeyActorToken = globalThis[TOKEN_KEY];

export { journeyActorToken };
