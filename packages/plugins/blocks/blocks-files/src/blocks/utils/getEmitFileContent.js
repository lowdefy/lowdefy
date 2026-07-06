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

import { type } from '@lowdefy/helpers';

import readFileAsBase64 from '../../utils/readFileAsBase64.js';

// customRequest for emitFileContent mode: no upload happens. The file is read
// as base64 and { name, size, type, content } is emitted as the block value
// and onChange event, so the app can hand it to an API endpoint routine that
// stores it with a server-side write request.
const getEmitFileContent =
  ({ methods, setFileList, setLoading = () => null }) =>
  async ({ file }) => {
    if (type.isNone(file)) {
      console.warn('File is undefined in getEmitFileContent');
      return;
    }
    try {
      setLoading(true);
      file.content = await readFileAsBase64(file);
      const nextState = await setFileList({ event: 'onSuccess', file });
      await methods.triggerEvent({ name: 'onChange', event: nextState });
      setLoading(false);
    } catch (error) {
      await setFileList({ event: 'onError', file });
      setLoading(false);
      throw error;
    }
  };

export default getEmitFileContent;
