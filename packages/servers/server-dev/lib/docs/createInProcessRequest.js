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

// A stand-in for the Hono context of a request the dev server serves itself: a headless journey's
// page reads and calls, made in this process. createLowdefyContext reads the request's url,
// method, headers and cookies from it, so the journey's recording and mutant cookies apply to
// these calls as they apply to a browser journey's requests.
function createInProcessRequest({ cookies, method, origin, path }) {
  const headers = new Headers({ host: new URL(origin).host });
  if (cookies.length > 0) {
    headers.set('cookie', cookies.map(({ name, value }) => `${name}=${value}`).join('; '));
  }
  return {
    get: () => undefined,
    req: {
      header: (name) =>
        name === undefined ? Object.fromEntries(headers.entries()) : headers.get(name) ?? undefined,
      method,
      path,
      raw: { headers, signal: new AbortController().signal },
      url: `${origin}${path}`,
    },
  };
}

export default createInProcessRequest;
