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

import { type, urlQuery as urlQueryFn } from '@lowdefy/helpers';

function createLink({ backLink, disabledLink, lowdefy, newOriginLink, noLink, sameOriginLink }) {
  function link(props) {
    if (props.disabled === true) {
      return disabledLink(props);
    }
    if (
      [!props.pageId, !props.back, !props.home, !props.href, !props.url].filter((v) => !v).length >
      1
    ) {
      throw Error(
        `Invalid Link: To avoid ambiguity, only one of 'back', 'home', 'href', 'pageId' or 'url' can be defined.`
      );
    }
    if (props.back === true) {
      // Cannot set input or urlQuery on back
      return backLink(props);
    }
    const query = type.isNone(props.urlQuery) ? '' : `${urlQueryFn.stringify(props.urlQuery)}`;
    if (props.home === true) {
      const pathname = `/${lowdefy.home.configured ? '' : lowdefy.home.pageId}`;
      return sameOriginLink({
        ...props,
        pathname,
        query,
        setInput: () => {
          lowdefy.inputs[`page:${lowdefy.home.pageId}`] = props.input ?? {};
        },
      });
    }
    if (type.isString(props.pageId)) {
      return sameOriginLink({
        ...props,
        pathname: `/${props.pageId}`,
        query,
        setInput: () => {
          lowdefy.inputs[`page:${props.pageId}`] = props.input ?? {};
        },
      });
    }
    if (type.isString(props.href)) {
      return newOriginLink(props);
    }
    if (type.isString(props.url)) {
      const protocol = props.url.includes(':') ? '' : 'https://';
      return newOriginLink({
        ...props,
        url: `${protocol}${props.url}`,
        query,
      });
    }
    return noLink(props);
  }
  return link;
}

export default createLink;
