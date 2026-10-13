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

import React from 'react';

// A resolved link (see resolveLink) through the Lowdefy Link component, which
// navigates with the router on a plain click and leaves modified clicks to the
// browser.
function CellLink({ link, components, className, onClick, children }) {
  const { Link } = components;
  return (
    <Link
      pageId={link.pageId}
      pathParams={link.pathParams}
      urlQuery={link.urlQuery}
      href={link.href}
      home={link.home}
      back={link.back}
      newTab={link.newTab}
      input={link.input}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default CellLink;
