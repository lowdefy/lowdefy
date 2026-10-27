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

const ACCENT = '#4f9cf9';

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const overlayContainer = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483000,
  fontFamily,
  fontSize: 13,
  color: '#ffffff',
  pointerEvents: 'none',
};

const highlightBox = {
  position: 'fixed',
  border: `2px solid ${ACCENT}`,
  backgroundColor: 'rgba(79,156,249,0.08)',
  borderRadius: 4,
  pointerEvents: 'none',
  transition: 'top 60ms ease, left 60ms ease, width 60ms ease, height 60ms ease',
  boxSizing: 'border-box',
};

const labelChip = {
  position: 'absolute',
  top: -22,
  left: -2,
  backgroundColor: ACCENT,
  color: '#fff',
  fontSize: 11,
  lineHeight: '16px',
  padding: '2px 6px',
  borderRadius: 4,
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
};

export { highlightBox, labelChip, overlayContainer };
