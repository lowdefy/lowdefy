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

function firstHeaderValue(headers, name) {
  if (!headers) return undefined;
  const value = headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function extractInitiator(context) {
  const user = context?.user ?? context?.session?.user ?? {};
  const headers = context?.headers ?? context?.req?.headers;
  const forwardedFor = firstHeaderValue(headers, 'x-forwarded-for');
  const ip =
    (forwardedFor && forwardedFor.split(',')[0].trim()) ||
    firstHeaderValue(headers, 'x-real-ip') ||
    firstHeaderValue(headers, 'cf-connecting-ip');

  return {
    userId: user.id ?? user.sub,
    sub: user.sub,
    roles: user.roles,
    ip,
    userAgent: firstHeaderValue(headers, 'user-agent'),
  };
}

export default extractInitiator;
