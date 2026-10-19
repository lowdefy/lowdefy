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

import axios from 'axios';
import { type } from '@lowdefy/helpers';

import PullStoppedError from './PullStoppedError.js';

const MAX_WAIT_S = 60;
const DEFAULT_WAIT_S = 5;
const MAX_RETRIES = 10;
const REQUEST_TIMEOUT_MS = 60 * 1000;
const BUDGET_CODE = 'api_queries_budget_exceeded';

function defaultSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry-After is seconds or an HTTP date. PostHog's throttle body also says
// "Expected available in N seconds", read when the header is missing.
function readWaitSeconds({ headers, data, now }) {
  const header = headers?.['retry-after'];
  if (!type.isNone(header)) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds);
    const date = Date.parse(header);
    if (!Number.isNaN(date)) return Math.max(0, Math.ceil((date - now) / 1000));
  }
  const detail = type.isString(data?.detail) ? data.detail : '';
  const match = /available in (\d+) seconds?/i.exec(detail);
  return match ? Number(match[1]) : DEFAULT_WAIT_S;
}

function isBudgetExceeded({ data }) {
  return data?.code === BUDGET_CODE || JSON.stringify(data ?? '').includes(BUDGET_CODE);
}

function stopError({ budget, retryAt }) {
  const when = retryAt.toISOString();
  if (budget) {
    return new PullStoppedError(
      `PostHog's hourly query read budget for personal API keys is used up. Days already pulled are kept; run the pull again after ${when} to resume.`,
      { reason: 'read_budget', retryAt }
    );
  }
  return new PullStoppedError(
    `PostHog is rate limiting queries. Days already pulled are kept; run the pull again after ${when} to resume.`,
    { reason: 'rate_limit', retryAt }
  );
}

function failureMessage({ status, data }) {
  const detail = type.isString(data?.detail) ? ` ${data.detail}` : '';
  if (status === 401 || status === 403) {
    return `PostHog refused the query (${status}).${detail} Check that POSTHOG_PERSONAL_API_KEY has the Query Read scope on project POSTHOG_PROJECT_ID, and that POSTHOG_API_HOST is that project's region.`;
  }
  return `PostHog query failed (${status}).${detail}`;
}

// The one place the pull talks to PostHog: a HogQL query over
// POST /api/projects/:id/query/, one request at a time. A 429 is waited out
// and retried when PostHog asks for a minute or less; a longer wait stops the
// pull cleanly. The key is sent only as the Authorization header to apiHost
// and is never part of a log line, an error or a returned value.
function createPostHogQueryClient({ projectId, apiHost, apiKey, logger, sleep = defaultSleep }) {
  const url = `${apiHost}/api/projects/${encodeURIComponent(projectId)}/query/`;

  async function post({ body }) {
    try {
      return await axios.post(url, body, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
      });
    } catch (error) {
      // An axios error carries the request config, headers and key included,
      // so only its message travels on.
      throw new Error(`PostHog request to ${apiHost} failed: ${error.message}`);
    }
  }

  async function query({ query: hogql, values, filterTestAccounts }) {
    const body = {
      query: { kind: 'HogQLQuery', query: hogql, values, filters: { filterTestAccounts } },
      name: 'lowdefy journeys pull',
    };
    for (let attempt = 0; ; attempt += 1) {
      const response = await post({ body });
      const { status, headers, data } = response;
      if (status === 429) {
        const waitS = readWaitSeconds({ headers, data, now: Date.now() });
        const budget = isBudgetExceeded({ data });
        if (waitS > MAX_WAIT_S || attempt >= MAX_RETRIES) {
          throw stopError({ budget, retryAt: new Date(Date.now() + waitS * 1000) });
        }
        logger.info(
          `PostHog ${
            budget ? 'read budget' : 'rate limit'
          } reached; waiting ${waitS}s before retrying.`
        );
        await sleep(waitS * 1000);
        continue;
      }
      if (status < 200 || status >= 300) {
        throw new Error(failureMessage({ status, data }));
      }
      const bytesRead = Number(headers?.['x-posthog-query-bytes-read'] ?? 0);
      return {
        results: data?.results ?? [],
        columns: data?.columns ?? [],
        bytesRead: Number.isFinite(bytesRead) ? bytesRead : 0,
      };
    }
  }

  return { query };
}

export default createPostHogQueryClient;
