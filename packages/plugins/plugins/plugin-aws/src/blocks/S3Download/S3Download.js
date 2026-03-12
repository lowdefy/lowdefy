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
import { ConfigProvider, Upload } from 'antd';
import { withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

const downloadFile = async ({ file, methods }) => {
  const s3DownloadPolicy = await methods.triggerEvent({
    name: '__getS3DownloadPolicy',
    event: { file },
  });
  window.open(s3DownloadPolicy?.responses?.__getS3DownloadPolicy?.response?.[0]);
};

const S3Download = ({ blockId, classNames = {}, methods, properties, styles = {} }) => {
  useEffect(() => {
    methods.registerEvent({
      name: '__getS3DownloadPolicy',
      actions: [
        {
          id: '__getS3DownloadPolicy',
          type: 'Request',
          params: [properties.s3GetPolicyRequestId],
        },
      ],
    });
  }, []);
  const upload = (
    <Upload
      id={blockId}
      className={classNames.element}
      style={styles.element}
      fileList={properties.fileList ?? []}
      onPreview={async (file) => await downloadFile({ file, methods })}
      showUploadList={{ showRemoveIcon: false, showDownloadIcon: true }}
      onDownload={async (file) => await downloadFile({ file, methods })}
    />
  );
  if (type.isObject(properties.theme)) {
    return (
      <ConfigProvider theme={{ components: { Upload: properties.theme } }}>{upload}</ConfigProvider>
    );
  }
  return upload;
};

S3Download.meta = {
  category: 'display',
  icons: [],
  styles: ['element'],
};

export default withBlockDefaults(S3Download);
