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

// What marks a crumb or a switcher option: a progress ring with its number (a score), an image,
// an icon on a tint, or initials on a tint.
function Mark({ blockId, components: { Icon }, events, mark, size = 20 }) {
  if (!mark) return null;
  const box = { width: size, height: size, flex: `0 0 ${size}px` };
  if (typeof mark.percent === 'number') {
    const radius = 15;
    const circumference = 2 * Math.PI * radius;
    const share = Math.min(100, Math.max(0, mark.percent)) / 100;
    const color = mark.color ?? 'var(--ant-color-success)';
    return (
      <span className="lf-rail-mark lf-rail-mark-ring" style={box} aria-hidden="true">
        <svg viewBox="0 0 36 36" width={size} height={size}>
          <circle cx="18" cy="18" r={radius} className="lf-rail-mark-ring-track" />
          <circle
            cx="18"
            cy="18"
            r={radius}
            className="lf-rail-mark-ring-fill"
            style={{ stroke: color }}
            strokeDasharray={`${share * circumference} ${circumference}`}
            transform="rotate(-90 18 18)"
          />
        </svg>
        {size >= 24 && (
          <span className="lf-rail-mark-ring-text" style={{ color }}>
            {Math.round(mark.percent)}
          </span>
        )}
      </span>
    );
  }
  if (mark.src) {
    return <img className="lf-rail-mark lf-rail-mark-image" style={box} src={mark.src} alt="" />;
  }
  const tint = { ...box, background: mark.color ?? 'var(--ant-color-primary)' };
  if (mark.icon) {
    return (
      <span className="lf-rail-mark lf-rail-mark-tile" style={tint} aria-hidden="true">
        <Icon blockId={`${blockId}_mark_icon`} events={events} properties={mark.icon} />
      </span>
    );
  }
  return (
    <span
      className="lf-rail-mark lf-rail-mark-tile"
      style={{ ...tint, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {(mark.text ?? '').slice(0, 2)}
    </span>
  );
}

export default Mark;
