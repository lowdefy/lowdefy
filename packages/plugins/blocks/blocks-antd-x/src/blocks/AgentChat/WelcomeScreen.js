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
import { Welcome, Prompts } from '@ant-design/x';
import { Button } from 'antd';

// One track: a bordered card holding a heading and a column of starter chips.
// A chip fills the composer (onFill) rather than sending — a near-miss starter
// becomes an editable first draft, not a message the user never meant to send.
function TrackCard({ track, onFill }) {
  const prompts = track.prompts ?? [];
  return (
    <div
      style={{
        flex: '1 1 240px',
        border: '1px solid var(--ant-color-border)',
        borderRadius: 'var(--ant-border-radius-lg)',
        padding: 16,
        backgroundColor: 'var(--ant-color-bg-container)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {track.label && (
        <h5
          style={{
            margin: '0 0 4px',
            fontSize: 'var(--ant-font-size-heading-5)',
            fontWeight: 'var(--ant-font-weight-strong, 600)',
            lineHeight: 'var(--ant-line-height-heading-5)',
          }}
        >
          {track.label}
        </h5>
      )}
      {prompts.map((prompt, index) => {
        const text = typeof prompt === 'string' ? prompt : prompt.label;
        return (
          <Button
            key={index}
            block
            // antd buttons are nowrap and size to their longest line; height auto
            // plus whiteSpace normal lets a sentence-length starter wrap left.
            style={{
              height: 'auto',
              whiteSpace: 'normal',
              textAlign: 'left',
              paddingTop: 6,
              paddingBottom: 6,
            }}
            onClick={() => onFill?.(text)}
          >
            {text}
          </Button>
        );
      })}
    </div>
  );
}

// The chat empty state. Two modes:
//   - `config.tracks` present → a two-track teaching panel (ask a question /
//     build a report), each track a card of fill-the-composer starters. When
//     `inFlow` it renders top-aligned as a leading item inside the message
//     scroll area, so it scrolls up with the conversation and stays reachable
//     by scrolling back rather than being swapped out on the first send.
//   - otherwise → the flat Welcome + Prompts row, centred, sending on click.
function WelcomeScreen({ config, onPromptClick, onFill, inFlow }) {
  if (!config) return null;

  if (config.tracks) {
    return (
      <div
        style={
          inFlow
            ? {
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                width: '100%',
              }
            : {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }
        }
      >
        {config.title && (
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--ant-font-size-heading-3)',
              fontWeight: 'var(--ant-font-weight-strong, 600)',
              lineHeight: 'var(--ant-line-height-heading-3)',
            }}
          >
            {config.title}
          </h3>
        )}
        {config.description && (
          <div style={{ color: 'var(--ant-color-text-secondary)' }}>{config.description}</div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {config.tracks.map((track, index) => (
            <TrackCard key={index} track={track} onFill={onFill} />
          ))}
        </div>
      </div>
    );
  }

  const promptItems = (config.prompts ?? []).map((prompt, index) => ({
    key: prompt.key ?? `prompt-${index}`,
    label: prompt.label,
    description: prompt.description,
  }));

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <Welcome
        title={config.title}
        description={config.description}
        icon={config.icon}
        variant={config.variant}
      />
      {promptItems.length > 0 && (
        <Prompts items={promptItems} onItemClick={({ data }) => onPromptClick(data)} wrap />
      )}
    </div>
  );
}

export default WelcomeScreen;
