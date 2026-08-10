# Entity Detail Information Hierarchy

Use this reference when designing or reviewing account, customer, project, workflow, order, device,
or other entity-detail pages.

## Contents

1. Object-centered principle
2. Header anatomy
3. Identity and metadata
4. Action locality
5. Action hierarchy
6. Tabs and local navigation
7. Card economy
8. Overview content
9. Responsive behavior
10. Accessibility
11. Reference wireframe
12. Review checklist

## 1. Object-centered principle

Make the current entity the organizing object for identity, status, navigation, and actions.

Users should be able to answer these questions from one compact region:

- Where am I?
- Which entity am I viewing?
- What is its current state?
- What can I do to this entity?
- Where are its related data views?

Keep these answers adjacent. Do not distribute them across a breadcrumb, hero card, action card,
status card, and unrelated buttons.

Use one dominant identity expression. Do not repeat the same entity name as breadcrumb text, page
title, card title, and summary label.

## 2. Header anatomy

Compose a compact entity header in this order:

1. Breadcrumb or parent collection context
2. Entity identity
3. Primary status
4. Entity actions
5. Compact metadata
6. Local tabs
7. Divider

On wide screens, align identity and metadata to the inline start. Align status and actions to the
inline end.

Use a flat page-header region. Do not wrap the identity block in a Card unless the entire product
uses cards as persistent object containers.

Keep the header visually quieter than the main content:

- Use one strong identity weight.
- Use muted metadata.
- Use one compact status token.
- Use one action trigger or a small action group.
- Avoid large borders and excessive vertical padding.

## 3. Identity and metadata

Show each fact once.

Prefer:

- Human-readable entity identity
- Stable identifier in a secondary metadata line
- Creation or update date when operationally useful
- One primary lifecycle status

Format metadata as compact key-value text:

`Account ID · 1000…0001`  
`Created Jul 24, 2026`

Use monospace only for identifier values, not the entire metadata sentence.

Do not repeat statuses in both the header and the first overview card unless the overview provides
additional history, diagnostics, or controls.

## 4. Action locality

Place an action next to the object it changes:

- Entity action → entity header
- Collection action → collection toolbar
- Row action → table row or row overflow menu
- Field action → field or input group
- Form action → form footer
- Section action → section header
- File action → file row or preview

This is the action-ownership rule: the visible target and its action should share a region.

Do not place entity-wide controls in an unrelated lower card. Do not make users search multiple
sections for actions that affect the entity itself.

## 5. Action hierarchy

Limit the entity header to:

- At most one prominent primary action when the workflow truly has one
- One `Actions` overflow trigger for secondary operational commands
- A clearly separated destructive action inside the overflow menu or confirmation flow

Examples of secondary entity actions:

- Synchronize
- Reconcile
- Pause or resume
- Regenerate credentials
- Archive
- Delete

Keep navigation such as Chats, Files, and Workflows out of the action group when those destinations
already exist as tabs.

Show the entity's status as state, not as a disabled action button.

## 6. Tabs and local navigation

Place local tabs directly below entity identity and metadata:

`Overview · Chats · Files · Workflows`

Use tabs or route-backed tab links consistently:

- Keep the active destination visually obvious.
- Preserve the entity context across every destination.
- Use a divider or active indicator to connect tabs to the content below.
- Keep tab labels concise.
- Do not duplicate tab destinations as header action buttons.

Use a back link or breadcrumb for the parent collection. Do not use both a prominent back button
and a full breadcrumb when one clear parent affordance is sufficient.

## 7. Card economy

Use Cards for content groups, not automatically for every hierarchy level.

Good Card candidates:

- Status summary with multiple independent metrics
- Recent activity
- Configuration form
- Diagnostics
- Bounded empty or error state

Poor Card candidates:

- Page identity
- Breadcrumb
- Tabs
- A single metadata row
- A standalone action button
- Information already visible in the header

Reduce nested borders. One page section should not need a Card inside another Card merely to create
spacing.

## 8. Overview content

Begin overview content with the highest-value operational summaries:

- Account state
- Authorization state
- Synchronization activity
- Data coverage

Use consistent summary items or compact cards. Make each summary answer a distinct question.

Avoid:

- Repeating the same status token from the header without added detail
- Long prose that restates labels
- Mixing entity actions into status summaries
- Showing raw identifiers more than once

Move detailed workflows, files, chats, and diagnostics behind their corresponding tabs or sections.

## 9. Responsive behavior

On narrow screens:

- Keep identity first.
- Keep primary status visible.
- Move secondary actions into one overflow menu.
- Wrap metadata into one or two short rows.
- Make tabs horizontally scrollable or use a compact local navigation pattern.
- Preserve action ownership; do not move entity actions into unrelated content cards.

Do not hide the current entity identity while actions remain visible.

## 10. Accessibility

- Mark breadcrumb or parent navigation with an accessible navigation label.
- Use a real heading for entity identity when the breadcrumb does not already serve as the page
  title.
- Announce status with visible text, not color alone.
- Give the Actions trigger an accessible name tied to the entity.
- Use menu items with explicit verbs.
- Preserve route-backed tab semantics and current-page indication.
- Keep destructive actions behind confirmation when consequences are significant.
- Maintain logical focus order: identity → status/actions → tabs → content.

## 11. Reference wireframe

```text
Accounts / +886•••••7774            ● Active   [Actions ▾]
Account ID · 1000…0001              Created Jul 24, 2026

Overview    Chats    Files    Workflows
────────────────────────────────────────────

[Account state] [Authorization] [Sync activity] [Data coverage]
```

Interpret the wireframe as hierarchy, not fixed pixels:

- Keep one compact identity region.
- Attach status and actions to the entity.
- Attach local navigation to the entity header.
- Begin content after a clear divider.

## 12. Review checklist

- [ ] Entity identity appears once as the dominant label.
- [ ] Status and entity actions are adjacent to the identity.
- [ ] Metadata is compact and not repeated.
- [ ] Secondary commands live in one Actions menu.
- [ ] Navigation destinations are tabs rather than duplicate buttons.
- [ ] Tabs sit directly below the entity header.
- [ ] Page identity and tabs are not wrapped in unnecessary Cards.
- [ ] Every action is visually attached to its target.
- [ ] Overview summaries add information instead of repeating the header.
- [ ] Mobile keeps identity, status, actions, and tabs in a coherent order.
- [ ] Focus order and accessible labels preserve the same hierarchy.
