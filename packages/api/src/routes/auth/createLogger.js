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

const authWarnings = {
  NEXTAUTH_URL:
    'NEXTAUTH_URL - Environment variable NEXTAUTH_URL is missing. Set it in your .env file. On Vercel, VERCEL_URL is used automatically.',
  NO_SECRET:
    'NO_SECRET - No `secret` configured. In development a temporary secret is generated, but production requires an explicit secret.',
  DEBUG_ENABLED:
    'DEBUG_ENABLED - NextAuth debug mode is enabled. This is meant for development only — remove it before deploying to production.',
  EXPERIMENTAL_API:
    'EXPERIMENTAL_API - An experimental NextAuth API is in use. It may change or be removed in a future version.',
};

function createLogger({ logger }) {
  return {
    error: (code, metadata) => {
      const error = metadata instanceof Error ? metadata : metadata?.error;
      if (error) {
        error.code = code;
      }
      logger.error(error);
    },
    warn: (code) => {
      logger.warn(authWarnings[code] ?? code);
    },
    debug: (code, metadata) => {
      logger.debug(metadata, code);
    },
  };
}

export default createLogger;
