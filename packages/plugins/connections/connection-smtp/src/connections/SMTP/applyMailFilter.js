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

// eslint-plugin-import's node resolver does not read package exports maps.
// eslint-disable-next-line import/no-unresolved
import addressparser from 'nodemailer/lib/addressparser';
import { type } from '@lowdefy/helpers';

// nodemailer reads a string recipient as a comma-separated list, so a string holding several
// addresses is split into one entry per address, with nodemailer's own parser. A string holding
// one address is kept as written.
function splitEntries(entries) {
  if (type.isNone(entries)) {
    return [];
  }
  return (type.isArray(entries) ? entries : [entries]).flatMap((entry) => {
    if (!type.isString(entry)) {
      return [entry];
    }
    const parsed = addressparser(entry, { flatten: true });
    return parsed.length > 1 ? parsed : [entry];
  });
}

// An entry from splitEntries: a string with one address, a request object ({ name, email }) or
// a parsed nodemailer object ({ name, address }).
function getBareEmail(entry) {
  if (type.isObject(entry)) {
    return String(entry.address ?? entry.email ?? '')
      .trim()
      .toLowerCase();
  }
  if (!type.isString(entry)) {
    return '';
  }
  const [parsed] = addressparser(entry, { flatten: true });
  return (parsed?.address ?? '').trim().toLowerCase();
}

function getDomain(email) {
  return email.slice(email.lastIndexOf('@') + 1);
}

// A loop, not /\.+$/: that regex takes quadratic time on a long run of dots, and the domain comes
// from the request.
function trimTrailingDots(domain) {
  let end = domain.length;
  while (end > 0 && domain[end - 1] === '.') {
    end -= 1;
  }
  return domain.slice(0, end);
}

// .invalid is reserved and never resolves (RFC 6761). A trailing dot is the fully qualified
// form of the same domain.
function isInvalid(entry) {
  const domain = trimTrailingDots(getDomain(getBareEmail(entry)));
  return domain === 'invalid' || domain.endsWith('.invalid');
}

// Returns the field as written when nothing is dropped, so mail without .invalid recipients
// reaches nodemailer unchanged.
function dropInvalid(entries) {
  const split = splitEntries(entries);
  const kept = split.filter((entry) => !isInvalid(entry));
  if (kept.length === split.length) {
    return entries;
  }
  return kept.length === 0 ? undefined : kept;
}

// Mail to .invalid is dropped on every send, filter or not, and only those recipients are
// dropped: a real cc or bcc recipient still gets the mail when every to recipient is .invalid.
// Returns null when no recipient is left.
function dropInvalidRecipients(mail) {
  const to = dropInvalid(mail.to);
  const cc = dropInvalid(mail.cc);
  const bcc = dropInvalid(mail.bcc);
  if (type.isNone(to) && type.isNone(cc) && type.isNone(bcc)) {
    return null;
  }
  return { ...mail, to, cc, bcc };
}

function createMatcher({ allowlist, regex }) {
  const allowedDomains = type.isNone(allowlist)
    ? null
    : allowlist.map((domain) => domain.toLowerCase());
  const pattern = type.isNone(regex) ? null : new RegExp(regex);
  return function matches(entry) {
    const email = getBareEmail(entry);
    if (allowedDomains !== null && !allowedDomains.includes(getDomain(email))) {
      return false;
    }
    if (pattern !== null && !pattern.test(email)) {
      return false;
    }
    return true;
  };
}

function filterEntries({ entries, matches }) {
  return splitEntries(entries).filter(matches);
}

function applyMailFilter({ filter, mail: received }) {
  const mail = dropInvalidRecipients(received);
  if (mail === null) {
    return null;
  }
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
