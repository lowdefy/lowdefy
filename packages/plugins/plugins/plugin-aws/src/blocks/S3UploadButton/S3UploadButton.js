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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Button } from '@lowdefy/blocks-antd/blocks';

import { Upload } from 'antd';

import useFileList from '../utils/useFileList.js';
import getS3Upload from '../utils/getS3Upload.js';

const S3UploadButtonBlock = ({ blockId, components, events, methods, properties, value }) => {
  const [state, loadFileList, setFileList, removeFile, setValue] = useFileList({
    properties,
    methods,
    value,
  });
  const s3UploadRequest = getS3Upload({ methods, setFileList });
  useEffect(() => {
    methods.setValue({ file: null, fileList: [] });
    methods.registerEvent({
      name: '__getS3PostPolicy',
      actions: [
        {
          id: '__getS3PostPolicy',
          type: 'Request',
          params: [properties.s3PostPolicyRequestId],
        },
      ],
    });
  }, []);
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(state)) {
      setValue(value);
    }
  }, [value]);
  return (
    <Upload
      accept={properties.accept ?? '*'}
      beforeUpload={loadFileList}
      customRequest={s3UploadRequest}
      disabled={properties.disabled}
      fileList={state.fileList}
      id={blockId}
      maxCount={properties.maxCount}
      multiple={!properties.singleFile} // Allows selection of multiple files at once, does not block multiple uploads
      onRemove={removeFile}
      showUploadList={properties.showUploadList}
      onChange={() => {
        methods.triggerEvent({ name: 'onChange' });
      }}
    >
      <Button
        blockId={`${blockId}_button`}
        components={components}
        events={events}
        properties={{
          disabled: properties.disabled,
          icon: 'AiOutlineUpload',
          title: 'Upload',
          type: 'default',
          ...properties.button,
        }}
        methods={methods}
      />
    </Upload>
  );
};

S3UploadButtonBlock.defaultProps = blockDefaultProps;
S3UploadButtonBlock.meta = {
  valueType: 'object',
  category: 'input',
  icons: ['AiOutlineUpload'],
  styles: ['blocks/S3UploadButton/style.less'],
};

export default S3UploadButtonBlock;
