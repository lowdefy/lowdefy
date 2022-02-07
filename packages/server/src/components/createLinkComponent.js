import React from 'react';
import NextLink from 'next/link';
import { createLink } from '@lowdefy/engine';
import { type } from '@lowdefy/helpers';

const createLinkComponent = (lowdefy) => {
  const backLink = ({ children, className, id }) => (
    <a id={id} onClick={() => lowdefy._internal.router.back()} className={className}>
      {type.isFunction(children) ? children(id) : children}
    </a>
  );
  const newOriginLink = ({ children, className, href, id, newTab, pageId, url }) => {
    return (
      <a
        id={id}
        href={href}
        className={className}
        target={newTab && '_blank'}
        rel={newTab && 'noopener noreferrer'}
      >
        {type.isFunction(children) ? children(pageId || url || id) : children}
      </a>
    );
  };
  const sameOriginLink = ({ children, className, href, id, newTab, pageId, url }) => {
    if (newTab) {
      return (
        <a
          id={id}
          href={`${window.location.origin}${lowdefy.basePath}${href}`}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
        >
          {type.isFunction(children) ? children(pageId || url || id) : children}
        </a>
      );
    }
    return (
      <NextLink href={href}>
        <a id={id} className={className}>
          {type.isFunction(children) ? children(pageId || url || id) : children}
        </a>
      </NextLink>
    );
  };
  const noLink = ({ className, children, id }) => (
    <span id={id} className={className}>
      {type.isFunction(children) ? children(id) : children}
    </span>
  );
  return createLink({
    backLink,
    lowdefy,
    newOriginLink,
    sameOriginLink,
    noLink,
    disabledLink: noLink,
  });
};

export default createLinkComponent;
