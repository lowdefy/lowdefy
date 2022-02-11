import React from 'react';
import NextLink from 'next/link';
import { createLink } from '@lowdefy/engine';
import { type } from '@lowdefy/helpers';

const createLinkComponent = (lowdefy) => {
  const backLink = ({ ariaLabel, children, className, id, rel }) => (
    <a
      id={id}
      onClick={() => lowdefy._internal.router.back()}
      className={className}
      rel={rel}
      aria-label={ariaLabel || 'back'}
    >
      {type.isFunction(children) ? children(id) : children}
    </a>
  );
  const newOriginLink = ({
    ariaLabel,
    children,
    className,
    href,
    id,
    newTab,
    pageId,
    rel,
    url,
  }) => {
    return (
      <a
        id={id}
        aria-label={ariaLabel}
        className={className}
        href={href}
        rel={rel || (newTab && 'noopener noreferrer')}
        target={newTab && '_blank'}
      >
        {type.isFunction(children) ? children(pageId || url || id) : children}
      </a>
    );
  };
  const sameOriginLink = ({
    ariaLabel,
    children,
    className,
    href,
    id,
    newTab,
    pageId,
    rel,
    replace,
    scroll,
    url,
  }) => {
    if (newTab) {
      return (
        <a
          id={id}
          aria-label={ariaLabel}
          className={className}
          href={`${window.location.origin}${lowdefy.basePath}${href}`}
          rel={rel || 'noopener noreferrer'}
          target="_blank"
        >
          {type.isFunction(children) ? children(pageId || url || id) : children}
        </a>
      );
    }
    return (
      <NextLink href={href} replace={replace} scroll={scroll}>
        <a id={id} aria-label={ariaLabel} className={className} rel={rel}>
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
