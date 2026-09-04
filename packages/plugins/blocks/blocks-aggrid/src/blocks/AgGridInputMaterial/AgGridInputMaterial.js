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
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';

import antdStyles from '../../ag-grid-antd.module.css';
import { themeMaterialAntd, useGridTheme } from '../../theme/themeLowdefy.js';

import AgGridInput from '../../AgGridInput.js';

const AgGridInputMaterial = ({
  blockId,
  classNames,
  events,
  loading,
  methods,
  properties,
  required,
  styles,
  validation,
  value,
}) => {
  const theme = useGridTheme(themeMaterialAntd, properties.themeParams);

  return (
    <div
      {...blockRootProps({
        blockId,
        classNames,
        styles,
        className: `ag-theme-material ${antdStyles.antdTheme}`,
        style: { width: '100%', height: properties.height ?? 500 },
      })}
    >
      <AgGridInput
        blockId={blockId}
        events={events}
        loading={loading}
        methods={methods}
        properties={properties}
        required={required}
        theme={theme}
        validation={validation}
        value={value}
      />
    </div>
  );
};

export default withBlockDefaults(AgGridInputMaterial);
