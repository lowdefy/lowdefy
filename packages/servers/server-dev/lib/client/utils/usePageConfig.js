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

import useSWR from 'swr';

import request from './request.js';

function fetchPageConfig(url) {
  return request({ url });
}

function usePageConfig(pageId, basePath) {
  const { data } = useSWR(`${basePath}/api/page/${pageId}`, fetchPageConfig, { suspense: true });
  return { data };
}

export default usePageConfig;
