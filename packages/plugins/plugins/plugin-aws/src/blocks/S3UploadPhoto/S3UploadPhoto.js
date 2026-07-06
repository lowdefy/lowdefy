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
import { UploadPhoto } from '@lowdefy/blocks-files/blocks';

// Deprecated alias for the generic UploadPhoto block in @lowdefy/blocks-files.
// Maps the legacy s3PostPolicyRequestId property onto uploadPolicyRequestId.
const S3UploadPhoto = (props) => {
  useEffect(() => {
    console.warn(
      'The S3UploadPhoto block is deprecated. Use the UploadPhoto block with "uploadPolicyRequestId" instead.'
    );
  }, []);
  const { s3PostPolicyRequestId, ...properties } = props.properties ?? {};
  return (
    <UploadPhoto
      {...props}
      properties={{
        uploadPolicyRequestId: s3PostPolicyRequestId,
        ...properties,
      }}
    />
  );
};

export default S3UploadPhoto;
