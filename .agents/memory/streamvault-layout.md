---
name: StreamVault App.tsx layout
description: The outer layout structure in App.tsx and why AdminBanner is outside the flex-row div
---

**Rule:** `AdminBanner` must be a direct child of the outer `flex-col` wrapper, NOT inside the `flex-col md:flex-row` inner div.

**Why:** On iPad/tablet (md breakpoint), the layout switches to `flex-row`. If AdminBanner is inside that div, it becomes a flex-row sibling of Sidebar and main — causing it to render as a tall left column that covers the full screen height instead of a top banner.

**Correct structure in App.tsx:**
```jsx
<div className="flex min-h-screen w-full flex-col bg-[#06060a] overflow-x-hidden">
  <AdminBanner />          {/* ← outside flex-row, always full-width top bar */}
  <div className="flex flex-1 flex-col md:flex-row min-h-0">
    <Sidebar />
    <main>...</main>
    <AdBanner />
  </div>
</div>
```

**How to apply:** Any new full-width banners (notifications, alerts) must follow this pattern — place them above the inner `flex-col md:flex-row` div.
