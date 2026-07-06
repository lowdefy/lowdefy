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

function getBareEmail(entry) {
  if (type.isObject(entry)) {
    return String(entry.email ?? '').toLowerCase();
  }
  const angleMatch = /<([^<>]+)>/.exec(String(entry));
  if (angleMatch) {
    return angleMatch[1].toLowerCase();
  }
  return String(entry).toLowerCase();
}

function createMatcher({ allowlist, regex }) {
  const allowedDomains = type.isNone(allowlist)
    ? null
    : allowlist.map((domain) => domain.toLowerCase());
  const pattern = type.isNone(regex) ? null : new RegExp(regex);
  return function matches(entry) {
    const email = getBareEmail(entry);
    if (allowedDomains !== null) {
      const domain = email.slice(email.lastIndexOf('@') + 1);
      if (!allowedDomains.includes(domain)) {
        return false;
      }
    }
    if (pattern !== null && !pattern.test(email)) {
      return false;
    }
    return true;
  };
}

function filterEntries({ entries, matches }) {
  if (type.isNone(entries)) {
    return [];
  }
  return (type.isArray(entries) ? entries : [entries]).filter(matches);
}

function applyMailFilter({ filter, mail }) {
  if (type.isNone(filter)) {
    return mail;
  }
  const { replaceAddress, allowlist, regex } = filter;
  if (type.isNone(replaceAddress) && type.isNone(allowlist) && type.isNone(regex)) {
    return mail;
  }
  // replaceAddress short-circuits: all mail redirects to the catch-all address, one copy.
  if (!type.isNone(replaceAddress)) {
    return { ...mail, to: replaceAddress, cc: undefined, bcc: undefined };
  }
  const matches = createMatcher({ allowlist, regex });
  const to = filterEntries({ entries: mail.to, matches });
  if (to.length === 0) {
    return null;
  }
  const cc = filterEntries({ entries: mail.cc, matches });
  const bcc = filterEntries({ entries: mail.bcc, matches });
  return {
    ...mail,
    to,
    cc: cc.length === 0 ? undefined : cc,
    bcc: bcc.length === 0 ? undefined : bcc,
  };
}

export default applyMailFilter;
