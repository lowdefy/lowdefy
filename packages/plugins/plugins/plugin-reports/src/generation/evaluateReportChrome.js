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

// Evaluate one config value in the page's client-operator context. `_user`,
// `_state`, `_string`, … all resolve exactly as they do for the live page.
// `undefined` short-circuits to `undefined`.
function evaluate(parser, input, location) {
  if (type.isUndefined(input)) return undefined;
  const { output } = parser.parse({ input, location, arrayIndices: [] });
  return output;
}

// The already-evaluated page-level report options the PDF translator consumes.
// `size`/`orientation` arrive build-validated and pass through untouched;
// `title`/`header`/`footer` evaluate now. Title defaults to the page's own
// title, else the pageId.
function evaluateReportChrome({ context, pageConfig, pageId }) {
  const parser = context._internal.parser;
  const reportKey = pageConfig?.report ?? {};

  const title =
    evaluate(parser, reportKey.title, pageId) ??
    evaluate(parser, pageConfig?.properties?.title, pageId) ??
    pageId;

  return {
    title,
    size: reportKey.size,
    orientation: reportKey.orientation,
    header: evaluate(parser, reportKey.header, pageId),
    footer: evaluate(parser, reportKey.footer, pageId),
  };
}

export default evaluateReportChrome;
