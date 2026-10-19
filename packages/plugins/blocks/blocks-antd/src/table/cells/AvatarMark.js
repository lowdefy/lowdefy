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
import avatarColor from '@lowdefy/block-utils/format/avatarColor.js';
import initials from '@lowdefy/block-utils/format/initials.js';
import { type } from '@lowdefy/helpers';

// An avatar as plain DOM: a lazy image when there is a source, otherwise
// initials on a colour seeded from the id (or the name), so a person keeps
// their colour on every row.
function AvatarMark({ name, src, seed, shape }) {
  const className =
    shape === 'square' ? 'lf-table-avatar lf-table-avatar-square' : 'lf-table-avatar';
  if (type.isString(src) && src !== '') {
    return <img className={className} src={src} alt={name ?? ''} loading="lazy" decoding="async" />;
  }
  return (
    <span
      className={className}
      style={{ '--lf-table-tone': avatarColor(seed ?? name) }}
      aria-hidden="true"
    >
      {initials(type.isString(name) ? name : String(name ?? ''))}
    </span>
  );
}

export default AvatarMark;
