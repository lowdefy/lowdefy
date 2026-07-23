---
'@lowdefy/blocks-antd': patch
---

fix: Keep long sidebar menus fully reachable.

Two related sidebar scrolling issues are fixed:

- When the sidebar is collapsed, hovering a menu group with a long nested list opened a
  flyout whose top was pushed above the screen, so the first items were cut off and
  unreachable — most noticeable for groups low down the menu on shorter screens. Flyout
  menus now stay within the viewport and scroll, so every item is reachable.

- When the sidebar is expanded with a menu taller than the screen, the last item could be
  hidden behind the logo/profile footer with no way to scroll it into view. The menu now
  scrolls between a fixed toggle and footer, so the last item is always reachable.
