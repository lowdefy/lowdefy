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

function applyMailFilter({ filter, mail }) {
  if (type.isNone(filter)) {
    return mail;
  }
  const { replaceAddress, allowlist, regex } = filter;
  if (type.isNone(replaceAddress) && type.isNone(allowlist) && type.isNone(regex)) {
    return mail;
  }
  if (!type.isNone(replaceAddress)) {
    return { ...mail, to: replaceAddress, cc: undefined, bcc: undefined };
  }

  const allowedDomains = type.isNone(allowlist)
    ? null
    : allowlist.map((domain) => domain.toLowerCase());
  const addressRegex = type.isNone(regex) ? null : new RegExp(regex);

  function getBareAddress(recipient) {
    if (type.isObject(recipient)) {
      return recipient.email.toLowerCase();
    }
    const match = recipient.match(/<([^>]+)>/);
    if (match) {
      return match[1].toLowerCase();
    }
    return recipient.toLowerCase();
  }

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
