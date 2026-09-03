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

import reloadPage from './reloadPage.js';
import resolveTarget from './resolveTarget.js';

function createLink({ backLink, disabledLink, lowdefy, newOriginLink, noLink, sameOriginLink }) {
  function link(props) {
    if (props.disabled === true) {
      return disabledLink(props);
    }
    // back has no pathname to resolve and cannot carry input or urlQuery.
    if (props.back === true) {
      return backLink(props);
    }
    // href is an HTML-attribute passthrough the <Link> component reads, not a
    // navigation target, so it never enters the grammar resolver.
    if (type.isString(props.href)) {
      return newOriginLink(props);
    }
    const target = resolveTarget({
      lowdefy,
      target: {
        home: props.home,
        pageId: props.pageId,
        url: props.url,
        urlQuery: props.urlQuery,
      },
    });
    if (type.isNone(target)) {
      return noLink(props);
    }
    if (target.kind === 'external') {
      // The resolver's href is the whole URL with any query already folded in,
      // so it is passed as the url prop the callback reads with an empty query.
      return newOriginLink({ ...props, url: target.href, query: '' });
    }
    return sameOriginLink({
      ...props,
      pathname: target.pathname,
      query: target.query,
      // The anchor renderer calls link() while rendering and only calls this
      // callback when the link is followed, so navigation-time work rides on
      // it rather than running here.
      setInput: getOnNavigate({ lowdefy, props, target }),
    });
  }
  return link;
}

// A page-kind url names no page, so it seeds no input - writing
// inputs['page:undefined'] is the bug family a no-op setInput avoids.
function getSetInput({ lowdefy, props }) {
  if (props.home === true) {
    return () => {
      lowdefy.inputs[`page:${lowdefy.home.pageId}`] = props.input ?? {};
    };
  }
  if (type.isString(props.pageId)) {
    return () => {
      lowdefy.inputs[`page:${props.pageId}`] = props.input ?? {};
    };
  }
  return () => {};
}

// A trailing slash names the same page, and the browser path carries the
// basePath the resolved target never does.
function toAppPathname({ lowdefy, pathname }) {
  const basePath = lowdefy.basePath ?? '';
  const appPathname = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  if (appPathname.length > 1 && appPathname.endsWith('/')) {
    return appPathname.slice(0, -1);
  }
  return appPathname;
}

function isCurrentPathname({ lowdefy, pathname }) {
  const currentPathname = lowdefy._internal?.globals?.window?.location?.pathname;
  if (!type.isString(currentPathname)) {
    return false;
  }
  return (
    toAppPathname({ lowdefy, pathname: currentPathname }) === toAppPathname({ lowdefy, pathname })
  );
}

// `reload: true` on a link to the page already open re-runs that page's mount
// chains - the navigation itself is a no-op there, so without it onMount never
// fires again. On a link to another page the mount chains run anyway.
function getOnNavigate({ lowdefy, props, target }) {
  const setInput = getSetInput({ lowdefy, props });
  if (props.reload !== true || !isCurrentPathname({ lowdefy, pathname: target.pathname })) {
    return setInput;
  }
  // The reload promise is returned rather than awaited here: the anchor's
  // onClick and the action's push both call this synchronously and navigate
  // on, while a caller that wants to know when the chains finished can await.
  return () => {
    setInput();
    return reloadPage({ lowdefy });
  };
}

export default createLink;
