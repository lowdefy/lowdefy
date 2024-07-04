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

import { type } from '@lowdefy/helpers';

const layoutParamsToArea = ({ areaKey, area = {}, layout = {} }) => {
  if (areaKey !== 'content') {
    return area;
  }
  area.align = type.isNone(area.align) ? layout.contentAlign : area.align;
  area.direction = type.isNone(area.direction) ? layout.contentDirection : area.direction;
  area.gutter = type.isNone(area.gutter) ? layout.contentGutter : area.gutter;
  area.justify = type.isNone(area.justify) ? layout.contentJustify : area.justify;
  area.overflow = type.isNone(area.overflow) ? layout.contentOverflow : area.overflow;
  area.wrap = type.isNone(area.wrap) ? layout.contentWrap : area.wrap;
  return area;
};

export default layoutParamsToArea;
