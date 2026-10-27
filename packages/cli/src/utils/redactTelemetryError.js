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

import os from 'os';

import { type } from '@lowdefy/helpers';

const MAX_MESSAGE_LENGTH = 300;
const MAX_STACK_FRAMES = 20;

function redactHome(text, homeDirectory) {
  if (!type.isString(text) || !type.isString(homeDirectory) || homeDirectory.length === 0) {
    return text;
  }
  return text.split(homeDirectory).join('~');
}

// What a CLI error report sent to api.lowdefy.net may carry. A command's error
// message quotes what the command met: file paths under the home directory
// (which name the person), config values, journey and data set content. The
// report needs the kind of failure and where in Lowdefy it was thrown, so the
// home directory becomes ~, the message is cut, and the stack keeps only its
// frames (its first line repeats the message).
function redactTelemetryError(error, { homeDirectory = os.homedir() } = {}) {
  const message = redactHome(String(error?.message ?? ''), homeDirectory);
  const frames = String(error?.stack ?? '')
    .split('\n')
    .filter((line) => line.trimStart().startsWith('at '))
    .slice(0, MAX_STACK_FRAMES)
    .map((line) => redactHome(line, homeDirectory));
  return {
    name: error?.name,
    message:
      message.length > MAX_MESSAGE_LENGTH ? `${message.slice(0, MAX_MESSAGE_LENGTH)}…` : message,
    stack: frames.join('\n'),
  };
}

export default redactTelemetryError;
