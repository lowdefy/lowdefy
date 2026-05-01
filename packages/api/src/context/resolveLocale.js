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

import { type } from '@lowdefy/helpers';

function parseAcceptLanguage(header) {
  if (!type.isString(header)) return [];
  return header
    .split(',')
    .map((entry) => {
      const [code, ...params] = entry.trim().split(';').map((s) => s.trim());
      const qParam = params.find((p) => p.startsWith('q='));
      const q = qParam ? parseFloat(qParam.slice(2)) : 1;
      return { code, q: Number.isFinite(q) ? q : 0 };
    })
    .filter(({ code }) => code.length > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ code }) => code);
}

function pickBest(candidates, supported) {
  for (const candidate of candidates) {
    if (supported.includes(candidate)) return candidate;
    const primary = candidate.split('-')[0].toLowerCase();
    const match = supported.find(
      (code) => code.split('-')[0].toLowerCase() === primary
    );
    if (match) return match;
  }
  return undefined;
}

function resolveLocale({ i18n, headers }) {
  if (!i18n || !type.isString(i18n.defaultLocale) || !type.isArray(i18n.locales)) {
    return undefined;
  }
  const supportedCodes = i18n.locales.map((l) => l.code);
  const acceptLanguage = headers?.['accept-language'];
  const candidates = parseAcceptLanguage(acceptLanguage);
  const matched = pickBest(candidates, supportedCodes);
  return matched ?? i18n.defaultLocale;
}

export default resolveLocale;
