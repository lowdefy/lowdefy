'use client';

import { useEffect, useRef, useState } from 'react';

function findActiveH2(toc, activeId) {
  for (const h2 of toc) {
    if (h2.id === activeId) return h2.id;
    if (h2.children.some((h3) => h3.id === activeId)) return h2.id;
  }
  return undefined;
}

function linkClass(active) {
  const base = 'block text-sm pl-3 border-l-2 transition-colors';
  return active
    ? `${base} border-primary-500 text-primary-500 dark:text-primary-400 -ml-px`
    : `${base} border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100`;
}

function subLinkClass(active) {
  const base = 'block text-xs pl-3 border-l-2 transition-colors leading-5';
  return active
    ? `${base} border-primary-500 text-primary-500 dark:text-primary-400 -ml-px`
    : `${base} border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100`;
}

export default function ArticleToc({ toc }) {
  const [activeId, setActiveId] = useState(toc[0]?.id);
  const isScrollingFromClick = useRef(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const matches = toc.some(
      (h2) => h2.id === hash || h2.children.some((h3) => h3.id === hash),
    );
    if (matches) setActiveId(hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, []);

  useEffect(() => {
    const articleEl = document.querySelector('.article-content');
    if (!articleEl) return;

    const allHeadings = [...articleEl.querySelectorAll('h2[id], h3[id]')];
    const visibility = new Map();
    for (const h of allHeadings) visibility.set(h.id, false);

    const recomputeActive = () => {
      if (isScrollingFromClick.current) return;
      let active = null;
      for (const h of allHeadings) {
        if (visibility.get(h.id)) active = h.id;
      }
      if (!active) {
        const fold = window.innerHeight * 0.3;
        for (const h of allHeadings) {
          if (h.getBoundingClientRect().top < fold) active = h.id;
        }
      }
      if (active) setActiveId(active);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting);
        }
        recomputeActive();
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    for (const h of allHeadings) observer.observe(h);
    recomputeActive();

    return () => observer.disconnect();
  }, [toc]);

  function handleClick(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    isScrollingFromClick.current = true;
    setActiveId(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    const release = () => {
      isScrollingFromClick.current = false;
    };
    if ('onscrollend' in window) {
      window.addEventListener('scrollend', release, { once: true });
    } else {
      setTimeout(release, 700);
    }
  }

  const activeH2Id = findActiveH2(toc, activeId);

  return (
    <nav aria-label="Table of contents" className="sticky top-20">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-4">
        On this page
      </p>
      <ol className="space-y-2">
        {toc.map((h2) => (
          <li key={h2.id}>
            <a
              href={`#${h2.id}`}
              onClick={(e) => handleClick(e, h2.id)}
              aria-current={activeId === h2.id ? 'location' : undefined}
              className={linkClass(activeId === h2.id)}
            >
              {h2.text}
            </a>
            {activeH2Id === h2.id && h2.children.length > 0 && (
              <ol className="mt-2 ml-3 space-y-1">
                {h2.children.map((h3) => (
                  <li key={h3.id}>
                    <a
                      href={`#${h3.id}`}
                      onClick={(e) => handleClick(e, h3.id)}
                      aria-current={activeId === h3.id ? 'location' : undefined}
                      className={subLinkClass(activeId === h3.id)}
                    >
                      {h3.text}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
