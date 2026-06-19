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

// NextAuth derives its origin (OAuth callbacks, sign-in redirects, base URL) from
// NEXTAUTH_URL verbatim in self-hosted setups - it ignores the request host. When the
// dev server picks a port, an unset NEXTAUTH_URL is defaulted to match so auth works on
// whatever port the app lands on. A pinned NEXTAUTH_URL with a different port is left
// untouched but warned about, since its redirects would target the wrong port.
function reconcileNextAuthUrl({ context }) {
  const { port } = context.options;
  const current = process.env.NEXTAUTH_URL;

  if (!current) {
    return `http://localhost:${port}`;
  }

  let currentPort;
  try {
    const url = new URL(current);
    currentPort = url.port || (url.protocol === 'https:' ? '443' : '80');
  } catch (_) {
    context.logger.warn(`NEXTAUTH_URL (${current}) is not a valid URL.`);
    return current;
  }

  if (currentPort !== String(port)) {
    context.logger.warn(
      `NEXTAUTH_URL (${current}) does not match the dev server port ${port}. ` +
        `NextAuth sign-in callbacks and redirects will target ${current}. ` +
        `Update NEXTAUTH_URL or unset it to let the dev server manage it.`
    );
  }

  return current;
}

export default reconcileNextAuthUrl;
