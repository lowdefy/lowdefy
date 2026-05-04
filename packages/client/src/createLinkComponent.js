import React from 'react';
import { createLink } from '@lowdefy/engine';
import { type } from '@lowdefy/helpers';

const createLinkComponent = (lowdefy, Link) => {
  const { window } = lowdefy._internal.globals;
  const backLink = ({ ariaLabel, children, className, id, onClick = () => {}, rel, style }) => (
    <a
      id={id}
      className={className}
      style={style}
      rel={rel}
      aria-label={ariaLabel ?? lowdefy._internal.translate('client.backAriaLabel')}
      onClick={(...params) => {
        lowdefy._internal.router.back();
        onClick(...params);
      }}
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
    onClick = () => {},
    newTab,
    pageId,
    query,
    rel,
    style,
    url,
  }) => {
    return (
      <a
        id={id}
        aria-label={ariaLabel}
        className={className}
        style={style}
        href={href ?? `${url}${query ? `?${query}` : ''}`}
        rel={rel ?? (newTab && 'noopener noreferrer')}
        target={newTab && '_blank'}
        onClick={async (...params) => {
          await onClick(...params);
          return true;
        }}
      >
        {type.isFunction(children) ? children(pageId ?? url ?? id) : children}
      </a>
    );
  };
  const sameOriginLink = ({
    ariaLabel,
    children,
    className,
    id,
    newTab,
    onClick = () => {},
    pageId,
    pathname,
    query,
    rel,
    replace,
    scroll,
    setInput,
    style,
    url,
  }) => {
    if (newTab) {
      return (
        // eslint-disable-next-line react/jsx-no-target-blank
        <a
          id={id}
          aria-label={ariaLabel}
          className={className}
          style={style}
          href={`${window.location.origin}${lowdefy.basePath}${pathname}${
            query ? `?${query}` : ''
          }`}
          rel={rel ?? 'noopener noreferrer'}
          target="_blank"
          onClick={async (...params) => {
            await onClick(...params);
            return true;
          }}
        >
          {type.isFunction(children) ? children(pageId ?? url ?? id) : children}
        </a>
      );
    }
    return (
      // This code can be made simpler.
      <Link
        href={{ pathname, query }}
        replace={replace}
        scroll={scroll}
        id={id}
        aria-label={ariaLabel}
        className={className}
        style={style}
        rel={rel}
        onClick={(...params) => {
          setInput();
          onClick(...params);
        }}
      >
        {type.isFunction(children) ? children(pageId ?? url ?? id) : children}
      </Link>
    );
  };
  const noLink = ({ className, children, id, onClick = () => {}, style }) => (
    <span id={id} className={className} style={style} onClick={onClick}>
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
