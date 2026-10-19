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

import getThemeCssVariables from '../../getThemeCssVariables.js';

const formComponentTokens = new Set([
  'labelColonMarginInlineEnd',
  'labelColonMarginInlineStart',
  'labelColor',
  'labelFontSize',
  'labelRequiredMarkColor',
]);

// Label reuses antd's Form.Item class names without rendering an antd Form, so its theme is set as
// the Form CSS variables style.css reads. The caller scopes them to the Label's own elements so, as
// with an antd component theme, a token such as colorError does not restyle the wrapped input.
function getLabelThemeStyle(theme) {
  return getThemeCssVariables({
    componentName: 'form',
    componentTokens: formComponentTokens,
    theme,
  });
}

export default getLabelThemeStyle;
