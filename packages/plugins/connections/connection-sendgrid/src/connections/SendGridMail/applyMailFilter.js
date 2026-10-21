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

function getBareAddress(recipient) {
  if (type.isObject(recipient)) {
    return recipient.email.toLowerCase();
  }
  // [^<>] keeps the match linear: with [^>] a long run of "<" takes quadratic time.
  const match = recipient.match(/<([^<>]+)>/);
  if (match) {
    return match[1].toLowerCase();
  }
  return recipient.toLowerCase();
}

// An "@" with at least one character on each side.
function isAddress(part) {
  const at = part.indexOf('@', 1);
  return at !== -1 && at < part.length - 1;
}

// SendGrid reads a string recipient as one address, so a string holding several addresses is
// not split: it is dropped only when every address in it is .invalid, and otherwise reaches
// SendGrid as written. Values of an unexpected shape are left for SendGrid to reject.
function getAddresses(recipient) {
  if (type.isObject(recipient)) {
    return type.isString(recipient.email) ? [recipient.email] : [];
  }
  if (!type.isString(recipient)) {
    return [];
  }
  // Splitting on the separators and checking each part is linear; matching
  // /[^\s<>,;"]+@[^\s<>,;"]+/g directly takes quadratic time on a long part with no "@".
  return recipient.split(/[\s<>,;"]+/).filter(isAddress);
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
function isInvalidAddress(address) {
  const domain = trimTrailingDots(
    address
      .slice(address.lastIndexOf('@') + 1)
      .trim()
      .toLowerCase()
  );
  return domain === 'invalid' || domain.endsWith('.invalid');
}

function isInvalid(recipient) {
  const addresses = getAddresses(recipient);
  return addresses.length > 0 && addresses.every(isInvalidAddress);
}

function toList(recipients) {
  if (type.isNone(recipients)) {
    return [];
  }
  return type.isArray(recipients) ? recipients : [recipients];
}

// Returns the field as written when nothing is dropped, so mail without .invalid recipients
// reaches SendGrid unchanged.
function dropInvalid(recipients) {
  const list = toList(recipients);
  const kept = list.filter((recipient) => !isInvalid(recipient));
  if (kept.length === list.length) {
    return recipients;
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

// SendGrid rejects a message with no to recipient, so the remaining cc and bcc recipients become
// to recipients with a copy each (isMultiple), which keeps a bcc recipient hidden from the others.
function ensureToRecipient(mail) {
  if (!type.isNone(mail.to)) {
    return mail;
  }
  return {
    ...mail,
    to: [...toList(mail.cc), ...toList(mail.bcc)],
    cc: undefined,
    bcc: undefined,
    isMultiple: true,
  };
}

function applyMailFilter({ filter, mail: received }) {
  const mail = dropInvalidRecipients(received);
  if (mail === null) {
    return null;
  }
  if (type.isNone(filter)) {
    return ensureToRecipient(mail);
  }
  const { replaceAddress, allowlist, regex } = filter;
  if (type.isNone(replaceAddress) && type.isNone(allowlist) && type.isNone(regex)) {
    return ensureToRecipient(mail);
  }
  if (!type.isNone(replaceAddress)) {
    return { ...mail, to: replaceAddress, cc: undefined, bcc: undefined };
  }

  const allowedDomains = type.isNone(allowlist)
    ? null
    : allowlist.map((domain) => domain.toLowerCase());
  const addressRegex = type.isNone(regex) ? null : new RegExp(regex);

  function isAllowed(recipient) {
    const address = getBareAddress(recipient);
    if (allowedDomains !== null) {
      const domain = address.slice(address.lastIndexOf('@') + 1);
      if (!allowedDomains.includes(domain)) {
        return false;
      }
    }
    if (addressRegex !== null && !addressRegex.test(address)) {
      return false;
    }
    return true;
  }

  function filterRecipients(recipients) {
    if (type.isNone(recipients)) {
      return undefined;
    }
    if (!type.isArray(recipients)) {
      return isAllowed(recipients) ? recipients : undefined;
    }
    const allowed = recipients.filter(isAllowed);
    if (allowed.length === 0) {
      return undefined;
    }
    return allowed;
  }

  const to = filterRecipients(mail.to);
  if (type.isUndefined(to)) {
    return null;
  }
  return { ...mail, to, cc: filterRecipients(mail.cc), bcc: filterRecipients(mail.bcc) };
}

export default applyMailFilter;
