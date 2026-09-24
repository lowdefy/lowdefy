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

import React from 'react';
import { Text } from '@react-email/components';
import { type } from '@lowdefy/helpers';

// The code is read off the screen and typed (or copied) into the tab the person
// started from, so it is rendered large, widely tracked and as selectable text -
// never as an image, which no mail client lets you copy from.
const codeStyle = {
  color: '#111111',
  fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  lineHeight: '40px',
  margin: '0 0 8px 0',
  userSelect: 'all',
};

const expiryStyle = {
  color: '#666666',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 16px 0',
};

// Seconds are the wire unit everywhere in auth config; minutes are what a person
// reads. Rounded up so the copy never promises less time than the code has.
function expiryMinutes(expiresIn) {
  if (!type.isInt(expiresIn) || expiresIn <= 0) {
    return undefined;
  }
  return Math.ceil(expiresIn / 60);
}

function OtpCode({ otp, expiresIn }) {
  if (!type.isString(otp) || otp === '') {
    return null;
  }
  const minutes = expiryMinutes(expiresIn);
  return (
    <>
      <Text style={codeStyle}>{otp}</Text>
      <Text style={expiryStyle}>
        {type.isNone(minutes)
          ? 'This code can only be used once.'
          : `This code expires in ${minutes} minute${
              minutes === 1 ? '' : 's'
            } and can only be used once.`}
      </Text>
    </>
  );
}

export default OtpCode;
