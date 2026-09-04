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

const MAX_TEXT = 4000;
const MAX_ID = 512;
const MAX_URL = 2048;
// A screenshot rides in the wide event as a data URL; there is no file store
// for reports in v1. 256 KB is what a sink will carry on one line without the
// report becoming the reason the line is dropped.
const MAX_SCREENSHOT = 256 * 1024;

function isBoundedString({ max, value }) {
  return type.isString(value) && value.length > 0 && value.length <= max;
}

// The report is a signed, authorized write into the app's log sink, so the
// body is checked before anything is emitted. The emitted fields are picked
// explicitly (logFeedbackReport), so passing this check does not let a caller
// name its own log fields.
function validateFeedbackReport(report) {
  if (!type.isObject(report)) {
    return { message: 'Feedback report should be an object.', valid: false };
  }
  if (!isBoundedString({ max: MAX_TEXT, value: report.text })) {
    return {
      message: `Feedback "text" should be a string of 1 to ${MAX_TEXT} characters.`,
      valid: false,
    };
  }
  if (!isBoundedString({ max: MAX_ID, value: report.page_id })) {
    return { message: 'Feedback "page_id" should be a string.', valid: false };
  }
  if (!type.isNone(report.block_id) && !isBoundedString({ max: MAX_ID, value: report.block_id })) {
    return { message: 'Feedback "block_id" should be a string.', valid: false };
  }
  if (!type.isNone(report.url) && !isBoundedString({ max: MAX_URL, value: report.url })) {
    return { message: 'Feedback "url" should be a string.', valid: false };
  }
  if (
    !type.isNone(report.session_id) &&
    !isBoundedString({ max: MAX_ID, value: report.session_id })
  ) {
    return { message: 'Feedback "session_id" should be a string.', valid: false };
  }
  if (!type.isNone(report.screenshot)) {
    if (!type.isString(report.screenshot) || !report.screenshot.startsWith('data:image/')) {
      return { message: 'Feedback "screenshot" should be an image data URL.', valid: false };
    }
    if (report.screenshot.length > MAX_SCREENSHOT) {
      return {
        message: `Feedback "screenshot" should be at most ${MAX_SCREENSHOT} characters.`,
        valid: false,
      };
    }
  }
  return { valid: true };
}

export default validateFeedbackReport;
