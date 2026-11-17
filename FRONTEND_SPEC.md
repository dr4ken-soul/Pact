# Pact Frontend Specification

**Status:** Design decisions confirmed. Planning specification only. No application code has been approved.

## 0. Product and design decisions

- Product: a bounded-permission AI payment layer for Bitcoin Cash.
- Name: Pact.
- Primary promise: an AI agent can prepare payment actions only within a user-defined spending cap, approved recipient, and expiry. The user can understand these limits and the payment outcome immediately.
- Mainnet demo: judges can connect a BCH wallet, review a real payment, and explicitly approve it. The app must never broadcast without a user-visible review and wallet signature.
- Gate 1: Bento Grid Operational.
- Gate 2: A2 Scroll-morph pill.
- Gate 3: subtle ambient motion, implemented as restrained coded canvas movement plus a localized SVG status detail. They must not become competing full-page motion layers.
- Gate 3 section behavior: restrained staggered viewport reveals, normal scrolling, no scroll-jacking or pinned sections.
- Gate 4: Sora headings, IBM Plex Sans body, IBM Plex Mono for data and identifiers.
- Gate 5: Graphite + signal mint. Exact tokens are below.
- Gate 6: product-first bento hero with policy controls and a reviewed payment path above the fold.
- Gate 7: required hackathon banner, app shell and demo, policy enforcement explanation, guided payment, activity, architecture, footer.
- Project Identity Fingerprint: top-left lead / bottom-right support / Swiss rational / monochrome + signal-mint pop / solid surface with live product UI and restrained procedural texture / front-loaded / subtle precision.
- Design dials: `DESIGN_VARIANCE 5 / MOTION_INTENSITY 2 / VISUAL_DENSITY 6`.
- No logo mark or custom brand symbol. Use a text-only Pact wordmark unless the user later requests a symbol.

## 1. Foundations

### 1.1 Palette and typography

The Composition Recipes reference does not define a palette specifically for Bento Grid Operational. Use this project palette, not a copied unrelated theme.

```css
:root {
  --bg-primary: #0B0F0E;
  --bg-secondary: #101715;
  --bg-surface: #151D1A;
  --bg-elevated: #1C2722;
  --accent: #A7F06A;
  --accent-hover: #BDF58E;
  --accent-glow: rgba(167, 240, 106, 0.14);
  --text-primary: #F2F5F1;
  --text-secondary: #A6B2AA;
  --text-muted: #68776E;
  --border-subtle: rgba(229, 242, 234, 0.06);
  --border-default: rgba(229, 242, 234, 0.12);
  --success: #69DB9A;
  --error: #FF7474;
  --warning: #F2C66D;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --font-display: 'Sora', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

Google Fonts import:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Sora:wght@400;500;600;700&display=swap');
```

Configure Tailwind aliases: `font-heading` maps to `var(--font-display)`, `font-body` maps to `var(--font-body)`, and `font-mono` maps to `var(--font-mono)`. Limit the page to three weights per family. Load text with `font-display: swap` and do not block first paint on font loading.

### 1.2 Layout rules

- Use CSS Grid with named areas for the top-level bento composition. Do not use Flexbox as the bento's top-level layout.
- Use 12 columns on desktop. The primary policy cell spans 8 columns and the payment demo cell spans 4. The mobile layout is one column.
- Use asymmetric cell sizes, 1px border treatment, no decorative card shadows, and a mathematically generated CSS noise texture.
- Keep the hero within a 1280 x 800 viewport where practical. The first screen contains the value proposition, the policy bounds, and the mainnet demo entry point.
- Keep DOM order aligned with the visual and keyboard reading order.
- Use no external hero image, video, brand logo, or decorative photography.

### 1.3 Global page frame

`body` classes: `min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-body antialiased selection:bg-[var(--accent)] selection:text-[var(--bg-primary)]`.

Main content container: `mx-auto w-full max-w-[1440px] px-4 md:px-8 xl:px-12`.

Global scroll treatment required by `FRONTEND_SKILL.md`: `html { scrollbar-width: none; scroll-behavior: smooth; }` and `html::-webkit-scrollbar { display: none; }`. Hiding the visual scrollbar must not disable keyboard, touch, wheel, or assistive scrolling. Keep visible focus and section navigation so the user is not dependent on the scrollbar for orientation.

The compact A2 navigation pill uses the exact `liquid-glass-dark` treatment from `FRONTEND_SKILL.md` Step 3B. Apply this CSS in the global design layer, and keep its use limited to the navigation:

```css
.liquid-glass-dark {
  background: rgba(0, 0, 0, 0.4);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}
.liquid-glass-dark::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.4px;
  background: linear-gradient(180deg,
    rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 20%,
    rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%,
    rgba(255,255,255,0.1) 80%, rgba(255,255,255,0.3) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

Global z-index map:

```text
z-0: page canvas, absolute inset-0, pointer-events-none
z-3: static CSS noise overlay, absolute inset-0, pointer-events-none
z-10: page content and section content, relative
z-40: mobile navigation drawer and overlay
z-50: scroll-morph navigation
z-60: top-of-homepage BCH BLAZE banner when at page top
z-[70]: transaction review dialog and wallet error dialog
z-[80]: transient accessible toast announcements
```

No section may introduce an undocumented stacking context. Every decorative layer uses `pointer-events-none` and has an accessible static fallback.

## 2. Section 0: Required BCH BLAZE banner

**Recipe:** bespoke announcement strip. It exists above the application navigation and is not a card in the bento grid.

**Purpose:** permanently satisfy the required top-of-homepage links to the Widget Factory presentation, source repository, and project-controlled EMBER2026 CashTokens donation address.

**Structure and classes:**

- Wrapper: `relative z-[60] min-h-9 border-b border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 md:px-6`.
- Inner row: `mx-auto flex w-full max-w-[1440px] flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between md:gap-4`.
- Left label: `flex items-center gap-2 font-medium text-[var(--text-primary)]`.
- Status dot: `h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]`.
- Link group: `flex flex-wrap items-center gap-x-4 gap-y-2 text-[var(--text-secondary)]`.
- Link: `min-h-11 inline-flex items-center underline-offset-4 transition-colors duration-150 hover:text-[var(--text-primary)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 md:min-h-8`.
- Donation address text: `max-w-full break-all font-mono text-[10px] text-[var(--text-secondary)] md:max-w-[360px] md:truncate`.
- Copy button: `min-h-11 min-w-11 rounded-[var(--radius-sm)] border border-[var(--border-default)] px-3 font-medium text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] md:min-h-8`.

Required links and values:

- `Widget Factory deck`: final project presentation URL, copied from the official template.
- `Source`: actual project repository URL.
- `EMBER2026 address`: a project-controlled CashTokens receive address that has been verified to accept the token.
- Official template source: https://docs.google.com/presentation/d/1Yfuk9CJkf4U9M_WukcELhumWgj3Ak6345Ewy8hSp-Hk/edit?slide=id.p#slide=id.p
- The final presentation URL, repository URL, and project CashTokens address are not yet known. Do not invent or reuse another team's values. Until configured, show a clear build-time warning in development and block release readiness. Do not ship a fake address or a dead link.

**Responsive behavior:** mobile stacks the label and links; address may wrap and copy remains a 44px target. Desktop uses one row. No horizontal page overflow.

**Animation:** none. The strip is immediately readable and remains in normal document flow. Do not make it sticky over the hero.

**Assets:** none. No logo asset. The mint status dot is CSS only.

**Z-index:** `z-[60]` while in the document flow; no overlay or fixed position.

## 3. Section 1: Navigation shell

**Recipe:** A2 Scroll-morph pill from `COMPOSITION_RECIPES.md` Step 2B.

**Initial position:** fixed below the banner at the top of the viewport. At `scrollY <= 80px`, the bar spans the content width with transparent background. At `scrollY > 80px`, it condenses into a centered pill showing only the text wordmark and one primary action. Full links move to the accessible drawer.

**Desktop classes:**

- Outer: `fixed inset-x-0 top-9 z-50 px-4 py-2 transition-[transform,width,background-color,border-radius] duration-[240ms] ease-out md:px-8`.
- Inner expanded: `mx-auto flex h-14 max-w-[1440px] items-center justify-between rounded-[var(--radius-md)] px-3 transition-[max-width,background-color,border-color] duration-[240ms] ease-out md:px-5`.
- Inner compact state: `liquid-glass-dark mx-auto flex h-12 w-fit min-w-[240px] items-center justify-between gap-8 rounded-full px-5 transition-[width,background-color,border-radius] duration-[240ms] ease-out`. The glass treatment is limited to the floating navigation pill, not the bento cells.
- Wordmark: `font-heading text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]`.
- Desktop links: `hidden items-center gap-1 md:flex`.
- Link: `rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.
- Wallet action: `min-h-11 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--bg-primary)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]`.
- Mobile trigger: `inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-default)] text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] md:hidden`.

Links: `Policy`, `Activity`, `How it works`. Primary action: `Connect wallet` while disconnected, `Wallet connected` with a visible network label after connection. No logo symbol.

**Mobile drawer:** wrapper `fixed inset-0 z-40 bg-[var(--bg-primary)]/95 p-4 backdrop-blur-[16px] md:hidden`; panel `ml-auto flex h-full w-full max-w-[360px] flex-col gap-2 border-l border-[var(--border-default)] p-4`; each link `min-h-11 rounded-[var(--radius-md)] px-4 py-3 text-base text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`. Close on Escape, outside click, or link activation. Trap focus while open and return focus to the trigger on close.

**Animation:** nav morph initial state is expanded with `opacity: 1`, `y: 0`, width `100%`; compact state uses `opacity: 1`, `y: 0`, width `fit-content`; duration `240ms`, ease `[0.2, 0.8, 0.2, 1]`, delay `0s`. Mobile drawer initial `{ opacity: 0, x: 16 }`, animate `{ opacity: 1, x: 0 }`, exit `{ opacity: 0, x: 16 }`, duration `180ms`, ease `[0.2, 0.8, 0.2, 1]`, delay `0s`. No scale transform.

**Reduced motion:** when `prefers-reduced-motion: reduce`, remove drawer movement and morph animation, keep state changes immediate, and preserve focus and visibility.

**Assets:** none.

**Z-index:** `z-50`. Drawer and backdrop `z-40`; the banner remains above at the top of the document.

## 4. Section 2: Product-first bento hero

**Structural reference:** `Bento Grid Operational` in `FRONTEND_SKILL.md` §2E. Quality benchmark: Golden Example 3, Product Mockup Hero, adapted to a live functional product surface. Do not use a screenshot mockup.

**Hero copy:**

- Eyebrow: `Bounded authority for AI payments`.
- Heading: `Set the limits. Keep the keys.`
- Supporting line: `Give an agent a BCH spending cap, an approved recipient, and an expiry. Pact makes the boundary and the payment result visible.`
- Primary action: `Create a spending rule`.
- Secondary action: `Try the payment demo`.
- Wallet safety copy: `Nothing is broadcast until you review the transaction and approve it in your wallet.`

**Layout:**

- Section: `relative z-10 px-4 pb-12 pt-16 md:px-8 md:pb-16 md:pt-20 xl:px-12`.
- Inner container: `mx-auto w-full max-w-[1440px]`.
- Intro grid: `grid grid-cols-1 items-end gap-6 md:grid-cols-12 md:gap-8`.
- Intro left: `md:col-span-8`.
- Eyebrow: `mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]`.
- Heading: `max-w-[14ch] font-heading text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--text-primary)] sm:text-5xl lg:text-6xl`.
- Supporting line: `mt-4 max-w-[58ch] text-sm leading-6 text-[var(--text-secondary)] md:text-base`.
- Intro right CTA group: `flex flex-col gap-3 md:col-span-4 md:items-end`.
- Primary CTA: `inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg-primary)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]`.
- Secondary CTA: `inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] px-5 text-sm font-medium text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.

**Bento grid:**

- Container: `mt-8 grid grid-cols-12 gap-px overflow-hidden rounded-[var(--radius-lg)] bg-[var(--border-default)]`.
- Policy cell: `relative col-span-12 min-h-[390px] bg-[var(--bg-surface)] p-4 sm:p-6 lg:col-span-8 lg:row-span-2 lg:p-8`.
- Demo cell: `relative col-span-12 min-h-[300px] bg-[var(--bg-secondary)] p-4 sm:p-6 lg:col-span-4 lg:row-span-2 lg:p-6`.
- Optional state strip: `relative col-span-12 grid grid-cols-1 gap-px bg-[var(--border-default)] sm:grid-cols-3`.
- State strip item: `min-h-20 bg-[var(--bg-surface)] p-4`.

The grid contains at most three cells. Do not add decorative metrics or placeholder testimonials.

### 4.1 Policy cell

Header:

- Header row: `flex flex-col gap-2 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:items-start sm:justify-between`.
- Title: `font-heading text-xl font-semibold tracking-[-0.035em] text-[var(--text-primary)] sm:text-2xl`.
- Helper: `max-w-[50ch] text-sm leading-5 text-[var(--text-secondary)]`.
- Policy status chip: `inline-flex min-h-8 w-fit items-center gap-2 rounded-full border border-[var(--border-default)] px-3 text-xs font-medium text-[var(--text-secondary)]`.

Fields use a consistent 44px minimum control height and clear labels:

- Form grid: `mt-5 grid grid-cols-1 gap-4 md:grid-cols-2`.
- Spending cap group: `flex flex-col gap-2 md:col-span-1`.
- Recipient group: `flex flex-col gap-2 md:col-span-1`.
- Expiry group: `flex flex-col gap-2 md:col-span-1`.
- Field label: `text-xs font-medium text-[var(--text-secondary)]`.
- Field control: `min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 font-mono text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)] hover:border-[var(--text-muted)] focus:border-[var(--accent)] focus-visible:ring-2 focus-visible:ring-[var(--accent-glow)]`.
- Currency suffix: `absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--text-muted)]`.
- Inline validation: `min-h-5 text-xs leading-5 text-[var(--error)]` for errors and `text-[var(--text-muted)]` for neutral hints.
- Constraint summary: `mt-4 grid grid-cols-1 gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] p-3 sm:grid-cols-3`.
- Summary label: `text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]`.
- Summary value: `mt-1 break-all font-mono text-xs text-[var(--text-primary)]`.
- Form action row: `mt-5 flex flex-col gap-3 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:items-center sm:justify-between`.
- Policy submit button: `inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg-primary)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`.
- Discard/reset button: `inline-flex min-h-11 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.

Form semantics and safety:

- Use labels associated with inputs, proper `inputmode`, address validation, and field-level errors.
- Do not silently normalize or truncate recipient addresses. Display the full recipient in review, with a copy action.
- Do not use a fabricated address, transaction ID, balance, or successful state.
- The maximum cap and currency precision must be validated in integer satoshis, not floating-point BCH.
- A policy is not shown as contract-enforced until the corresponding contract condition has been verified on Chipnet and its implementation path is active.

### 4.2 Judge payment cell

- Cell header: `flex items-start justify-between gap-4`.
- Title: `font-heading text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]`.
- Network badge: `inline-flex min-h-7 items-center gap-2 rounded-full border border-[var(--border-default)] px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)]`.
- Network dot: `h-2 w-2 rounded-full bg-[var(--warning)]` before connection; `bg-[var(--success)]` only after the connected wallet confirms BCH Mainnet.
- Description: `mt-3 text-sm leading-5 text-[var(--text-secondary)]`.
- Demo amount row: `mt-5 flex items-baseline justify-between border-t border-[var(--border-default)] pt-4`.
- Amount: `font-mono text-2xl font-medium tabular-nums tracking-[-0.04em] text-[var(--text-primary)]`.
- Label: `text-xs text-[var(--text-muted)]`.
- Recipient summary: `mt-4 break-all rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] p-3 font-mono text-[11px] leading-5 text-[var(--text-secondary)]`.
- Connect/prepare button: `mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--bg-primary)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50`.
- Wallet safety note: `mt-3 text-xs leading-5 text-[var(--text-muted)]`.

Behavior:

- When required recipient and demo amount configuration are absent, show `Demo payment setup required` and disable the transaction action. Do not invent an address.
- A demo preset may populate a verified project-controlled recipient and a small configured amount. The UI always displays both before review. No hidden or automatic send.
- `Connect wallet` starts the approved BCH wallet connection flow. Never request a seed phrase or private key.
- A mainnet transaction becomes enabled only after the network, recipient, amount, available funds, and policy bounds are checked.

### 4.3 State strip

Three cells, no invented statistics:

1. `Policy status`, value from actual local/contract state.
2. `Wallet network`, value from live wallet connection.
3. `Last payment`, actual transaction status or a purposeful empty state: `No payments yet. Your first reviewed payment will appear here.`

Classes are the item and label/value classes above. Do not use static claims such as `100% secure`, `instant`, or made-up success rates.

### 4.4 Hero background and animation

**Coded canvas:**

- Canvas: `pointer-events-none absolute inset-0 z-0 h-full w-full`.
- Draw a small set of clearly legible, low-contrast contour lines only in the outer gutters, not beneath form text. Use `--accent` at a restrained opacity and avoid particles, flashing, or cursor-following movement.
- One 4-second, low-amplitude drift on entry, then stop. No endless loop. The page remains readable if canvas fails or is disabled.
- Initial `{ opacity: 0, y: 2 }`; animate `{ opacity: 0.12, y: 0 }`; duration `4s`; ease `[0.2, 0.8, 0.2, 1]`; delay `0.2s`; then hold the final state. Under reduced motion, draw the static contour frame and do not animate.

**Noise:** inline SVG fractal noise via CSS `::after`; `position:absolute; inset:0; z-index:3; pointer-events:none; opacity:0.025; background-size:128px 128px`. No remote image or external asset.

**Policy card entry:** initial `{ filter: 'blur(4px)', opacity: 0, y: 8 }`; animate `{ filter: 'blur(0px)', opacity: 1, y: 0 }`; duration `0.38s`; ease `[0.16, 1, 0.3, 1]`; delay `0.04s`.

**Demo card entry:** same states; duration `0.38s`; ease `[0.16, 1, 0.3, 1]`; delay `0.10s`.

**State strip entries:** same states; duration `0.32s`; ease `[0.16, 1, 0.3, 1]`; delays `0.14s`, `0.18s`, `0.22s` in DOM order.

**Hover:** bento cells use `translateY(-2px)` and border colour shift to `--accent`, duration `200ms`, ease `ease-out`, delay `0s`. Never scale cards. Disable hover translation for touch-only pointers and reduced motion.

**Assets:** none. Canvas and texture are generated procedurally. Inline SVG icons use stroke `currentColor`, `stroke-width 1.5`, `viewBox 0 0 24 24`, with no brand silhouette.

**Z-index:** canvas `z-0`; noise `z-3`; content and cells `relative z-10`; navigation `z-50`; banner `z-60`; payment dialog `z-[70]`.

## 5. Section 3: Policy boundary explainer

**Layout:** a compact vertical boundary register, not a second bento grid. This preserves the hero as the page's single bento layout family, as required by the layout repetition cap.

- Section: `relative z-10 px-4 py-12 md:px-8 md:py-16 xl:px-12`.
- Container: `mx-auto max-w-[1440px]`.
- Section header: `mb-6 max-w-[68ch]`.
- Section heading: `font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-3xl`.
- Section intro: `mt-2 max-w-[58ch] text-sm leading-6 text-[var(--text-secondary)]`.
- Register: `flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]`.
- Register row: `grid grid-cols-1 gap-3 border-b border-[var(--border-default)] p-4 last:border-b-0 sm:p-5 md:grid-cols-[200px_minmax(0,1fr)_180px] md:items-center md:gap-6`.
- Row label: `text-sm font-semibold text-[var(--text-primary)]`.
- Row explanation: `max-w-[60ch] text-sm leading-6 text-[var(--text-secondary)]`.
- Row value: `font-mono text-xs leading-5 text-[var(--text-secondary)]`.
- Inline status: `inline-flex min-h-7 w-fit items-center rounded-full border border-[var(--border-default)] px-2.5 text-xs font-medium text-[var(--text-secondary)]`.

Three rows, in order:

- Spending cap: enforce a maximum cumulative funded allowance only if the selected UTXO/covenant design proves the remaining value cannot exceed the user's original funding. Do not present a per-payment cap as a lifetime cap.
- Approved recipient: compare the transaction locking bytecode or verified destination against the committed recipient, not a display string alone.
- Expiry: state the actual contract time/height basis and distinguish expiry from UI timeout. Reclaim behavior must be tested before claiming expiry is enforced.

**Animation:** each row uses initial `{ filter: 'blur(4px)', opacity: 0, y: 8 }`; animate `{ filter: 'blur(0px)', opacity: 1, y: 0 }`; duration `0.32s`; ease `[0.16, 1, 0.3, 1]`; delays `0s`, `0.06s`, `0.12s`. Trigger on each viewport entry and reset on exit. Content is visible by default if JavaScript is unavailable. Reduced motion sets duration `0s`, opacity `1`, filter `none`, transform `none`.

**Assets:** none. Use text labels and no decorative icon card pattern.

**Z-index:** section content `z-10`; no nested overlay.

## 6. Section 4: Guided payment and transaction result

**Purpose:** a judge can follow a short sequence without needing to explore the rest of the page.

**Layout classes:**

- Section: `relative z-10 px-4 py-12 md:px-8 md:py-16 xl:px-12`.
- Container: `mx-auto max-w-[1440px]`.
- Grid: `grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] bg-[var(--border-default)] lg:grid-cols-12`.
- Instructions cell: `bg-[var(--bg-surface)] p-5 md:p-8 lg:col-span-5`.
- Transaction cell: `bg-[var(--bg-secondary)] p-5 md:p-8 lg:col-span-7`.
- Step list: `mt-6 flex flex-col gap-0`.
- Step row: `grid grid-cols-[32px_1fr] gap-3 border-l border-[var(--border-default)] pb-6 pl-4 last:border-l-0`.
- Step marker: `-ml-[33px] flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] font-mono text-xs text-[var(--text-secondary)]`.
- Step copy: `text-sm leading-6 text-[var(--text-secondary)]`.
- Transaction summary: `grid grid-cols-1 gap-3 sm:grid-cols-2`.
- Summary cell: `rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] p-4`.
- Summary key: `text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]`.
- Summary value: `mt-2 break-all font-mono text-xs leading-5 text-[var(--text-primary)]`.
- Tx state: `mt-4 flex min-h-12 items-center gap-3 border-t border-[var(--border-default)] pt-4`.
- Primary action: `inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--bg-primary)] transition-colors duration-150 hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`.
- Explorer link: `inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.

**Required sequence:**

1. Connect a supported BCH wallet and show the actual selected network.
2. Review the active policy, amount, complete recipient address, fee estimate, and expiry.
3. User explicitly confirms in the connected wallet.
4. Broadcast only the wallet-approved transaction.
5. Show the real transaction ID and explorer link only after the provider returns them.
6. Show a clear pending, confirmed, rejected, expired, insufficient funds, or network-mismatch state.

Never label a transaction `success` from local UI state alone. An explorer link is a link to the real transaction ID. Never fabricate a transaction ID, balance, confirmation count, or contract proof.

**Review dialog:** backdrop `fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4`; dialog `max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 md:p-7`; title `font-heading text-xl font-semibold text-[var(--text-primary)]`; buttons `mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end`. Trap focus, announce errors, close on Escape before wallet authorization, and restore focus after close.

**SVG status motion:** one localized inline SVG ring beside the live transaction status. On verified state change only, initial `pathLength: 0`, animate `pathLength: 1`; duration `0.65s`; ease `[0.2, 0.8, 0.2, 1]`; delay `0s`; run once, then hold. No continuous pulse, flashing, or looping. Reduced motion presents the completed static ring immediately. Do not imply contract enforcement with this status animation.

**Section reveal:** instructions and transaction cells initial `{ filter: 'blur(4px)', opacity: 0, y: 8 }`; animate `{ filter: 'blur(0px)', opacity: 1, y: 0 }`; duration `0.36s`; ease `[0.16, 1, 0.3, 1]`; delays `0s` and `0.08s`. Visible-by-default fallback; reduced motion disables the reveal.

**Assets:** none. Icons and status ring are inline SVG. Do not use a wallet logo unless licensed and explicitly approved.

**Z-index:** section content `z-10`; review dialog `z-[70]`; toasts `z-[80]`.

## 7. Section 5: Activity and policy state

- Section: `relative z-10 px-4 py-12 md:px-8 md:py-16 xl:px-12`.
- Container: `mx-auto max-w-[1440px]`.
- Header: `mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`.
- Title: `font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]`.
- Table wrapper: `overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]`.
- Table: `w-full border-collapse text-left`.
- Header row: `border-b border-[var(--border-default)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]`.
- Header cell: `px-4 py-3`.
- Body row: `border-b border-[var(--border-subtle)] last:border-0`.
- Data cell: `px-4 py-4 text-sm text-[var(--text-secondary)]`.
- Identifier: `max-w-[240px] truncate font-mono text-xs text-[var(--text-primary)]`.
- Status chip: `inline-flex min-h-7 items-center rounded-full border border-[var(--border-default)] px-2.5 text-xs font-medium text-[var(--text-secondary)]`.
- Empty state: `flex min-h-40 flex-col items-start justify-center gap-2 p-5`.
- Empty-state title: `text-sm font-semibold text-[var(--text-primary)]`.
- Empty-state copy: `max-w-[48ch] text-sm leading-6 text-[var(--text-secondary)]`.

Rows must originate from real local records or chain/provider data. Empty state copy: `No payments yet. Your first reviewed payment will appear here.` Do not populate demo transaction rows with fake IDs or success states.

**Animation:** new real row initial `{ filter: 'blur(4px)', opacity: 0, y: 6 }`; animate `{ filter: 'blur(0px)', opacity: 1, y: 0 }`; duration `0.28s`; ease `[0.16, 1, 0.3, 1]`; delay `0s`. No row animation when reduced motion is set.

**Assets:** none.

**Z-index:** section content `z-10`; no overlay.

## 8. Section 6: Under the hood and integrations

**Recipe:** `architecture-layers` from `COMPOSITION_RECIPES.md`, with the confirmed Pact palette and typography. This avoids repeating the page's bento layout.

- Section: `relative z-10 px-4 py-12 md:px-8 md:py-16 xl:px-12`.
- Container: `mx-auto max-w-4xl px-4 md:px-8`.
- Heading: `font-heading text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-3xl`.
- Intro: `mt-2 max-w-[65ch] text-sm leading-6 text-[var(--text-secondary)]`.
- Layer list: `mt-8 flex flex-col gap-4`.
- Layer row: `grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors duration-200 hover:border-[var(--accent)] md:p-6`.
- Layer number: `font-mono text-sm text-[var(--text-muted)]`.
- Layer title: `text-base font-semibold text-[var(--text-primary)]`.
- Layer description: `mt-1 max-w-[65ch] text-sm leading-6 text-[var(--text-secondary)]`.

Three layers, in order:

1. `XO template`: the chosen transaction/template integration and documented version.
2. `BCH wallet`: WizardConnect integration is mandatory for the BCH BLAZE 2026 Mainnet track. XO is not a substitute for WizardConnect. The app never handles seed phrases.
3. `On-chain constraints`: only verified contract conditions are called cryptographic enforcement. Separate them from client-side rules.

Do not show partner logos or imply official endorsement. Link to the actual integration destinations with text links only.

**Animation:** each row initial `{ filter: 'blur(4px)', opacity: 0, y: 8 }`; animate `{ filter: 'blur(0px)', opacity: 1, y: 0 }`; duration `0.32s`; ease `[0.16, 1, 0.3, 1]`; delays `0s`, `0.06s`, `0.12s`. Use repeatable viewport entry behavior defined in Section 11. Content visible by default. Reduced motion disables reveal.

**Assets:** none.

**Z-index:** section content `z-10`.

## 9. Section 7: Footer

- Section: `relative z-10 border-t border-[var(--border-default)] px-4 py-8 md:px-8 xl:px-12`.
- Inner: `mx-auto flex max-w-[1440px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between`.
- Wordmark: `font-heading text-sm font-semibold text-[var(--text-primary)]`.
- Footer links: `flex flex-wrap items-center gap-x-5 gap-y-2`.
- Link: `inline-flex min-h-11 items-center text-xs text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]`.
- Disclosure: `max-w-[72ch] text-xs leading-5 text-[var(--text-muted)]`.

Include project documentation, source, and the actual network/transaction status. No fabricated version numbers, claims, or legal guarantees.

**Animation:** none.

**Assets:** none.

**Z-index:** section content `z-10`.

## 10. Responsive behavior

- Mobile first. 12-column hero collapses to one column below `lg`.
- Header controls and all important actions remain available at 320px and above.
- Interactive touch targets are at least 44 x 44px.
- Address values wrap rather than overflow. Long transaction IDs are visually truncated but remain fully copyable and available to assistive technology.
- No horizontal scroll, tiny hidden actions, or hover-only behavior.
- At tablet sizes, policy form fields use two columns only when each control can maintain a usable width.
- At reduced viewport heights, do not hide the payment safety copy or policy bounds. The page scrolls normally.

## 11. Accessibility, motion, and copy rules

- Use semantic headings, associated form labels, keyboard-operable menus, dialogs, copy buttons, and links.
- Visible keyboard focus uses `outline` or ring with `--accent`; never rely on colour alone for active state.
- Meet WCAG AA contrast for text and controls; test the final palette, especially muted text and borders.
- Respect `prefers-reduced-motion: reduce` for CSS, canvas, SVG, and JavaScript-driven motion. Set scroll reveals to static visible content, stop canvas animation, and disable path drawing.
- Core content is visible without JavaScript and without animation support.
- Announce transaction state changes through a concise `aria-live="polite"` region; use assertive announcement only for blocking errors.
- Do not use flashing, forced scrolling, autoplay video, looping ticker, or scroll-snap.
- All scroll-triggered entrances must replay every time an element enters the viewport, both after scrolling down and after returning from below. Never use `once: true`. For Framer Motion use `viewport={{ once: false, amount: 0.1 }}`. For IntersectionObserver, add the revealed state on entry and remove it when the element has fully left above the viewport. Use transitions, not CSS keyframes with `animation-fill-mode: forwards` or `both`, for scroll reveals.
- Page sections should be visible by default; animation may enhance them but must not be required to reveal essential policy or transaction content.
- Icons come from one approved system only: custom inline SVG or Google Material Icons. Do not add Lucide, Heroicons, Font Awesome, emoji, or raster icons without explicit approval.
- Hide the visual scrollbar using the global rules in Section 1.3, but preserve ordinary scrolling and orientation cues.
- Copy follows the complete rules in `PROJECT_RULES.md`: British English, concise natural sentences, no em dashes, correct punctuation, no duplicate CTA intent, no filler headlines, and no invented claims.

## 12. Copy and hierarchy audit

Apply the full durable rules in `PROJECT_RULES.md` before implementation and again before release. The confirmed page copy uses British English, avoids em dashes and banned AI filler, keeps labels and buttons free of trailing punctuation, and uses distinct CTA intent. Every future string, including validation, loading, transaction, and error states, must be reviewed for natural punctuation, grammatical flow, consistent voice, and truthfulness. No fake numbers, people, addresses, transaction history, or security claims are permitted.

The hero is one focused moment. It has one eyebrow, one heading, one supporting paragraph, and one primary plus one secondary action. Do not add a partner strip, decorative stats, extra badges, or a feature list to the hero. Across the page, use no more than one layout family per section, no more than six bento cells, and at most one eyebrow per three sections.

## 13. Asset briefs

No external image, video, 3D model, or brand asset is required by this design.

- Procedural canvas: generated in code, low-amplitude contour lines at the page margins, four-second one-shot drift, static fallback.
- CSS noise: inline SVG fractal noise, `baseFrequency 0.75`, `numOctaves 4`, tile `128px`, opacity `0.025`.
- UI icons: one source only, custom inline SVG or Google Material Icons. Do not install Lucide, Heroicons, Font Awesome, or another icon library without explicit approval. Inline SVGs use a 24 x 24 viewBox and `stroke-width 1.5`, with no external fetch and no logo-like mark.
- Status icon: localized inline SVG ring. It is informational only and never a substitute for actual transaction confirmation.

## 14. Guided setup values

Account-specific values are not a reason to stop unrelated planning or interface work. The future build agent must guide the user through obtaining the deck, repository, donation address, and demo configuration using direct action links and the click-by-click instructions in `BUILD_GUIDE.md`. The user must perform authenticated account and wallet actions. Never ask for secrets and never invent a value.

## 15. Pre-build unknowns and release readiness checks

The following values cannot be invented and must be supplied or configured before release:

- Project-controlled CashTokens address that can receive EMBER2026.
- Final Widget Factory deck URL.
- Source repository URL.
- Project-controlled BCH demo recipient address and an explicitly approved small demo amount.
- Current supported wallet setup and XO template/engine versions after checking official current docs.
- Verified contract behavior for spending cap, recipient, expiry, fee handling, change, and reclaim path.

Do not start a mainnet transaction during development or testing without explicit user approval and wallet confirmation.

## 16. Spec self-check

- [x] Every named UI element has an exact Tailwind class string.
- [x] Every motion effect has initial state, animate state, duration, easing, and delay.
- [x] Every section has a declared z-index stack.
- [x] Every image/video need has an explicit asset decision; this design requires none.
- [x] Responsive classes are defined where layout changes.
- [x] The Bento Grid Operational rules are referenced and applied.
- [x] Motion has static fallback and reduced-motion behavior.
- [x] The first screen communicates product value and exposes the judge payment path.
- [x] No logo or brand symbol has been invented.
