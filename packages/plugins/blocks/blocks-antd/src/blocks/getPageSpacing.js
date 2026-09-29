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

// The class names are full literals so Tailwind finds them when it scans the block source.
const pageSpacing = {
  default: {
    content: '0 40px 40px 40px',
    breadcrumb: { margin: '16px 0' },
    spacerClassName: 'py-1.5 sm:py-1.5 md:py-2.5 lg:py-5',
  },
  compact: {
    content: '0 16px 16px 16px',
    breadcrumb: { margin: '12px 0' },
    spacerClassName: 'py-2',
  },
  // Content runs edge to edge. The breadcrumb is page chrome, so it keeps an inset of its own.
  none: {
    content: 0,
    breadcrumb: { margin: 0, padding: '8px 16px' },
    spacerClassName: null,
  },
};

function getPageSpacing({ padding }) {
  return pageSpacing[padding ?? 'default'];
}

export default getPageSpacing;
