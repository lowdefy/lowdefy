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
  Plays the external IdP for the JWKS walkthrough scenarios: generates an
  RSA key pair at boot, serves the public key set on /jwks.json, and mints
  RS256 tokens on /token.

  Usage: node scripts/jwks-server.mjs   (from apps/auth-strategies)

    GET /jwks.json          the JWKS the app's external-idp strategy reads
    GET /token              a valid token (sub=idp-user-1)
    GET /token?sub=x&roles=a,b&branches=n,e
                            custom subject, realm_access.roles and
                            resource_access.branches claims
    GET /token?bad=key      signed with a rogue key (must be rejected)
    GET /token?bad=exp      already expired (must be rejected)
    GET /token?bad=iss      wrong issuer (must be rejected)
    GET /token?bad=aud      wrong audience (must be rejected)
*/

import http from 'node:http';
import { createRequire } from 'node:module';

// jose is not hoisted to the repo root - resolve it through the plugin
// package that depends on it.
const requireFromPlugin = createRequire(
  new URL(
    '../../../packages/plugins/plugins/plugin-better-auth/package.json',
    import.meta.url
  )
);
const { exportJWK, generateKeyPair, SignJWT } = await import(requireFromPlugin.resolve('jose'));

const port = Number(process.env.JWKS_PORT ?? 4100);
const issuer = `http://localhost:${port}`;
const audience = 'auth-strategies-api';

const { publicKey, privateKey } = await generateKeyPair('RS256');
const rogue = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);
jwk.alg = 'RS256';
jwk.use = 'sig';
jwk.kid = 'reference-key';

async function mintToken(query) {
  const bad = query.get('bad');
  const payload = { sub: query.get('sub') ?? 'idp-user-1' };
  const roles = query.get('roles');
  if (roles) {
    payload.realm_access = { roles: roles.split(',') };
  }
  const branches = query.get('branches');
  if (branches) {
    payload.resource_access = { branches: branches.split(',') };
  }
  const builder = new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: 'reference-key' })
    .setIssuedAt()
    .setIssuer(bad === 'iss' ? 'http://evil.example.test' : issuer)
    .setAudience(bad === 'aud' ? 'other-api' : audience)
    .setExpirationTime(bad === 'exp' ? Math.floor(Date.now() / 1000) - 60 : '15m');
  return builder.sign(bad === 'key' ? rogue.privateKey : privateKey);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, issuer);
  if (url.pathname === '/jwks.json') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ keys: [jwk] }));
    return;
  }
  if (url.pathname === '/token') {
    res.setHeader('content-type', 'text/plain');
    res.end(await mintToken(url.searchParams));
    return;
  }
  res.statusCode = 404;
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`Mock IdP listening on ${issuer}`);
  console.log(`  JWKS:  ${issuer}/jwks.json`);
  console.log(`  Token: ${issuer}/token`);
});
