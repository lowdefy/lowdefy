/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { Upload } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

const downloadFile = async ({ file, methods }) => {
  const s3DownloadPolicy = await methods.triggerEvent({
    name: '__getS3DownloadPolicy',
    event: { file },
  });
  window.open(s3DownloadPolicy?.responses?.__getS3DownloadPolicy?.response?.[0]);
};

const S3Download = ({ blockId, methods, properties }) => {
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
  return (
    <Upload
      id={blockId}
      className={methods.makeCssClass([properties.style])}
      fileList={properties.fileList ?? []}
      onPreview={async (file) => await downloadFile({ file, methods })}
      showUploadList={{ showRemoveIcon: false, showDownloadIcon: true }}
      onDownload={async (file) => await downloadFile({ file, methods })}
    />
  );
};

S3Download.defaultProps = blockDefaultProps;
S3Download.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/S3Download/style.less'],
};

export default S3Download;
