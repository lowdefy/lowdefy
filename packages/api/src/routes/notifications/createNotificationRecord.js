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

// Rough inversion of the interpolation pipeline for the preview text: strip
// author markdown syntax and unescape the backslash-escaped interpolated values.
function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~)/g, '')
    .replace(/\\([!-/:-@[-`{-~])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function derivePreview({ properties }) {
  if (type.isString(properties.preview) && properties.preview !== '') {
    return properties.preview;
  }
  if (type.isString(properties.message) && properties.message !== '') {
    return stripMarkdown(properties.message).slice(0, 140);
  }
  return null;
}

// Record fields are snake_case: they are app-facing data — app pipelines
// produce the conventional fields and app YAML queries the record.
function createNotificationRecord({
  id,
  notificationConfig,
  item,
  properties,
  contact,
  email,
  isValidEmail,
  html,
  text,
  appName,
}) {
  return {
    _id: id,
    key: item.deduplication_key ?? null,
    type: notificationConfig.notificationId,
    template: notificationConfig.type,

    contact_id: contact._id,
    contact,
    email,
    is_valid_email: isValidEmail,

    subject: properties.subject,
    title: properties.title ?? properties.subject,
    preview: derivePreview({ properties }),
    body: html,
    text,
    data: item,

    send_email: item.send_email ?? true,
    cc: type.isArray(item.cc) ? item.cc : null,
    bcc: type.isArray(item.bcc) ? item.bcc : null,
    sent: false,
    send_attempts: 0,
    last_attempt: null,
    email_result: null,

    read: false,
    popup: item.popup ?? false,

    created: { timestamp: new Date(), app_name: appName ?? null },
  };
}

export default createNotificationRecord;
