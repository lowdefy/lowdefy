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

/*
  Mints an HMAC (HS256) token for the service-jwt strategy walkthrough
  scenarios, signed with the same shared secret the app reads through
  _secret: JWT_SIGNING_SECRET.

  Usage: JWT_SIGNING_SECRET='...' node scripts/mint-jwt.mjs [flags]

    --sub <id>        subject claim              (default service-1)
    --email <email>   email claim                (default none)
    --roles <a,b>     roles claim                (default none)
    --aud <audience>  audience claim             (default auth-strategies-api)
    --bad exp         already expired            (must be rejected)
    --bad alg         signed with HS384          (must be rejected)
    --bad iss         wrong issuer               (must be rejected)
    --bad aud         wrong audience             (must be rejected)
*/

import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

// jose is not hoisted to the repo root - resolve it through the plugin
// package that depends on it.
const requireFromPlugin = createRequire(
  new URL(
    '../../../packages/plugins/plugins/plugin-better-auth/package.json',
    import.meta.url
  )
);
const { SignJWT } = await import(requireFromPlugin.resolve('jose'));

const secret = process.env.JWT_SIGNING_SECRET;
if (!secret) {
  console.error('Set JWT_SIGNING_SECRET to the shared secret the app is configured with.');
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    sub: { type: 'string', default: 'service-1' },
    email: { type: 'string' },
    roles: { type: 'string' },
    aud: { type: 'string', default: 'auth-strategies-api' },
    bad: { type: 'string' },
  },
});

const payload = { sub: values.sub };
if (values.email) {
  payload.email = values.email;
}
if (values.roles) {
  payload.roles = values.roles.split(',');
}

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: values.bad === 'alg' ? 'HS384' : 'HS256' })
  .setIssuedAt()
  .setIssuer(values.bad === 'iss' ? 'https://evil.example.test' : 'https://auth.example.test')
  .setAudience(values.bad === 'aud' ? 'other-api' : values.aud)
  .setExpirationTime(values.bad === 'exp' ? Math.floor(Date.now() / 1000) - 60 : '15m')
  .sign(new TextEncoder().encode(secret));

console.log(token);
