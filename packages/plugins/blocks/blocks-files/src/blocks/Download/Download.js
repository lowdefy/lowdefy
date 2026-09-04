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

import React, { useEffect } from 'react';
import { Upload as AntdUpload } from 'antd';
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';

import withTheme from '../../withTheme.js';

const downloadFile = async ({ file, methods }) => {
  const downloadPolicy = await methods.triggerEvent({
    name: '__getDownloadPolicy',
    event: { file },
  });
  window.open(downloadPolicy?.responses?.__getDownloadPolicy?.response?.[0]);
};

const Download = ({ blockId, classNames = {}, methods, properties, styles = {} }) => {
  useEffect(() => {
    methods.registerEvent({
      name: '__getDownloadPolicy',
      actions: [
        {
          id: '__getDownloadPolicy',
          type: 'Request',
          params: [properties.downloadPolicyRequestId],
        },
      ],
    });
  }, []);
  const showRemoveIcon = properties.showRemoveIcon ?? false;
  return (
    <AntdUpload
      {...blockRootProps({ blockId, classNames, styles })}
      fileList={properties.fileList ?? []}
      onPreview={async (file) => await downloadFile({ file, methods })}
      onDownload={async (file) => await downloadFile({ file, methods })}
      onRemove={(file) => {
        methods.triggerEvent({ name: 'onRemove', event: { file } });
        // Controlled fileList: the YAML handler decides whether to update state.
        // Return false so antd doesn't fire onChange with a removed-file list.
        return false;
      }}
      showUploadList={{ showDownloadIcon: true, showRemoveIcon }}
    />
  );
};

export default withBlockDefaults(withTheme('Upload', Download));
