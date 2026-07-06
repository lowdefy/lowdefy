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

import getUploadPolicy from '../../utils/getUploadPolicy.js';
import uploadFile from '../../utils/uploadFile.js';

const getUploadRequest =
  ({ methods, setFileList, setLoading = () => null }) =>
  async ({ file }) => {
    if (!file) {
      console.warn('File is undefined in getUploadRequest');
      return;
    }
    try {
      setLoading(true);
      const descriptor = await getUploadPolicy({ methods, file });
      // Object identity comes from the descriptor top level — the PUT branch
      // has no fields object, so fields can never be the source of key/bucket.
      file.bucket = descriptor.bucket;
      file.key = descriptor.key;
      file.percent = 20;

      await uploadFile({
        descriptor,
        file,
        onProgress: async (event) => {
          await setFileList({
            event: 'onProgress',
            file,
            percent: (event.loaded / event.total) * 80 + 20,
          });
        },
      });
      await setFileList({ event: 'onSuccess', file });
      setLoading(false);
    } catch (error) {
      await setFileList({ event: 'onError', file });
      setLoading(false);
      throw error;
    }
  };

export default getUploadRequest;
