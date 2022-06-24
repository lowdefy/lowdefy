import React from 'react';
import { createLink } from '@lowdefy/engine';
import { type } from '@lowdefy/helpers';

const createLinkComponent = (lowdefy, Link) => {
  const { window } = lowdefy._internal.globals;
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
    id,
    newTab,
    pageId,
    query,
    rel,
    url,
  }) => {
    return (
      <a
        id={id}
        aria-label={ariaLabel}
        className={className}
        href={`${url}${query ? `?${query}` : ''}`}
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
    id,
    newTab,
    pageId,
    pathname,
    query,
    rel,
    replace,
    scroll,
    setInput,
    url,
  }) => {
    if (newTab) {
      return (
        // eslint-disable-next-line react/jsx-no-target-blank
        <a
          id={id}
          aria-label={ariaLabel}
          className={className}
          href={`${window.location.origin}${lowdefy._internal.router.basePath}${pathname}${
            query ? `?${query}` : ''
          }`}
          rel={rel || 'noopener noreferrer'}
          target="_blank"
        >
          {type.isFunction(children) ? children(pageId || url || id) : children}
        </a>
      );
    }
    return (
      <Link href={{ pathname, query }} replace={replace} scroll={scroll}>
        <a id={id} aria-label={ariaLabel} className={className} rel={rel} onClick={setInput}>
          {type.isFunction(children) ? children(pageId || url || id) : children}
        </a>
      </Link>
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
