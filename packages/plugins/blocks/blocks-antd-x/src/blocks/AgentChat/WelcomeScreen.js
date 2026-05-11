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

function WelcomeScreen({ config, onPromptClick }) {
  if (!config) return null;

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
        <Prompts
          items={promptItems}
          onItemClick={({ data }) => onPromptClick(data)}
          wrap
        />
      )}
    </div>
  );
}

export default WelcomeScreen;
