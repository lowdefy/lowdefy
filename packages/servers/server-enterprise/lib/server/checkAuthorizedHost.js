/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

// TODO: Do we call this domain/host/url?
function checkAuthorizedHost({ license, req }) {
  const authorizedUrls = license.metadata?.domains ?? [];
  if (authorizedUrls.length === 0) {
    return true;
  }

  const protocol = req.socket.encrypted ? 'https://' : 'http://';
  const url = `${protocol}${req.headers.host}`;

  let match = false;
  for (const authorizedUrl of authorizedUrls) {
    const test = new RegExp(
      `^${authorizedUrl.replaceAll('.', '\\.').replaceAll('*', '.*').replaceAll('/', '\\/')}$`,
      'u'
    );
    if (url.match(test)) {
      match = true;
      break;
    }
  }
  return match;
}

export default checkAuthorizedHost;
