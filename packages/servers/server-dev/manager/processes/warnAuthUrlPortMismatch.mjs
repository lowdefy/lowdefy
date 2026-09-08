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

// Auth.js derives the app origin from request headers (trustHost), so an unset
// AUTH_URL works on whatever port the dev server binds to. But when AUTH_URL (or
// the v4 fallback NEXTAUTH_URL) is set, @auth/core pins the origin to it verbatim
// — OAuth callbacks and sign-in redirects then target that URL. A pinned URL on a
// mismatched port is left untouched but warned about.
function warnAuthUrlPortMismatch({ context }) {
  const { port } = context.options;
  const name = process.env.AUTH_URL ? 'AUTH_URL' : 'NEXTAUTH_URL';
  const current = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

  if (!current) return;

  let currentPort;
  try {
    const url = new URL(current);
    currentPort = url.port || (url.protocol === 'https:' ? '443' : '80');
  } catch (_) {
    context.logger.warn(`${name} (${current}) is not a valid URL.`);
    return;
  }

  if (currentPort !== String(port)) {
    context.logger.warn(
      `${name} (${current}) does not match the dev server port ${port}. ` +
        `Auth sign-in callbacks and redirects will target ${current}. ` +
        `Update ${name} or unset it to derive the origin from the request.`
    );
  }
}

export default warnAuthUrlPortMismatch;
