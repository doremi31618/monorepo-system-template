# Icon-Led Interface Design

Use this reference when a page feels text-heavy, action labels repeat, navigation is slow to scan,
or the user requests an icon-first interface.

## Contents

1. Principle
2. Icon and label decision matrix
3. Where icons should lead
4. Where text should remain
5. Page composition
6. Action patterns
7. Status and feedback
8. Accessibility
9. Responsive behavior
10. Review checklist

## 1. Principle

Design icon-led interfaces, not icon-only interfaces.

Use icons to:

- Make repeated actions recognizable before users read labels.
- Create visual landmarks for navigation, sections, statuses, and object types.
- Reduce duplicated words in dense toolbars and row actions.
- Communicate direction, state, or action category quickly.

Keep text when it carries necessary meaning, consequence, scope, or domain language.

Do not translate every noun into a glyph. An unfamiliar icon is slower to understand than a short
label.

## 2. Icon and label decision matrix

Choose presentation from familiarity, frequency, consequence, and available context:

| Situation | Presentation |
| --- | --- |
| Universal and repeated action | Icon-only with accessible name and tooltip |
| Familiar action with room available | Icon + short label |
| Primary page action | Icon + label |
| Domain-specific or unfamiliar action | Icon + label |
| Destructive or irreversible action | Icon + explicit label |
| Status or warning | Icon + text or icon + visible status token |
| Table row with a clear action column | Icon-only may be appropriate |
| Navigation destination | Icon + label until the navigation is persistently familiar |
| Overflow or display settings | Icon-only with tooltip |
| Long explanation or policy | Text; do not replace with icons |

Use icon-only controls for actions such as:

- Close
- Menu
- Search
- Filter
- Sort
- More actions
- Expand or collapse
- Refresh
- Copy
- Previous or next inside an established pagination control

Keep icon + label for actions such as:

- Add account
- Queue synchronization
- Estimate download
- Retry failed files
- Save override
- Delete account
- Cancel workflow
- Submit authentication code

## 3. Where icons should lead

Prioritize icons in these high-value areas:

- Global and local navigation
- Collection toolbars
- Table row actions
- Repeated card actions
- Search, filter, sort, display, refresh, and overflow controls
- Back, forward, expand, collapse, copy, preview, and download controls
- Section landmarks when several operational sections have similar visual weight
- Status summaries where icon shape reinforces the text
- Object-type labels such as account, chat, message, workflow, image, video, or file

Use one consistent icon family from the project's component configuration.

Do not add an icon to every paragraph, field label, or heading. Decorative repetition creates more
visual noise than text alone.

## 4. Where text should remain

Keep visible text for:

- Page titles
- Form field labels
- Primary commitments
- Destructive actions
- Security and authorization actions
- Unfamiliar operational commands
- Errors, warnings, and recovery instructions
- Scope summaries and irreversible consequences
- Data whose exact value matters

Shorten supporting text before hiding it:

- Move repeated implementation details into help text or a tooltip.
- Replace prose with compact key-value summaries when the information is structured.
- Use badges for short states.
- Use an icon + concise label for repeated action categories.
- Remove copy that repeats the page title or the control's visible state.

## 5. Page composition

Create a visual scan path:

1. Page or object identity
2. Status and key metrics
3. Primary actions
4. Main data or workflow
5. Secondary details

Prefer:

- Icon-led navigation items
- Compact action toolbars
- Status badges with icon reinforcement
- Small icon landmarks beside operational section titles
- Icon buttons for repeated row-level actions
- Disclosure controls for secondary explanatory copy

Avoid:

- Multiple large paragraphs before the first actionable control
- Repeating the same verb in every row
- Large button labels for universal actions
- Icons that do not add information or recognition
- Mixing filled, outlined, and differently weighted icons at one hierarchy level

## 6. Action patterns

Use icon-only actions only when all of these are true:

- The icon is familiar in the current context.
- The action repeats or lives in a known control cluster.
- The hit target remains large enough.
- An accessible name is present.
- A tooltip supplies the visible label on hover or keyboard focus.
- The consequence is not ambiguous.

Use icon + label when any of these are true:

- The action is primary.
- The action is domain-specific.
- The action changes server or workflow state.
- The action is destructive or expensive.
- The same icon could plausibly mean multiple things.
- New users need to learn the vocabulary.

Place leading action icons before labels. Use trailing icons for direction, disclosure, or external
navigation.

## 7. Status and feedback

Pair status icons with visible meaning:

- Success: check icon + `Ready`
- Warning: triangle icon + `Attention`
- Paused: pause icon + `Paused`
- In progress: spinner or activity icon + `Synchronizing`
- Failed: alert icon + `Failed`

Do not use color or icon shape as the only status signal.

Use motion sparingly:

- Animate only active progress icons.
- Stop animation when the operation stops.
- Respect reduced-motion settings.
- Do not animate decorative icons.

## 8. Accessibility

For icon-only buttons:

- Provide an accessible name with `aria-label` or visible tooltip semantics.
- Use a tooltip that opens for hover and keyboard focus.
- Keep at least a 44×44 CSS pixel hit target for primary touch contexts.
- Preserve visible focus.
- Mark decorative icons `aria-hidden="true"` when their label already names the action.
- Avoid relying on the SVG's filename or path for the accessible name.

For icon + label buttons:

- Let the visible label name the control.
- Treat the icon as decorative unless it adds information not present in the label.
- Keep icon placement and stroke weight consistent.

Test with icons unavailable or hidden. The critical workflow must remain understandable.

## 9. Responsive behavior

Adapt labels by context:

- Keep icon + label for primary and consequential actions at every breakpoint.
- Collapse familiar secondary toolbar actions to icon-only when space is constrained.
- Move low-priority actions into an overflow menu before shrinking hit targets.
- Preserve tooltips on desktop and accessible names everywhere.
- Do not assume mobile users understand more icon-only actions than desktop users.

Use responsive label hiding only for actions that pass the icon-only decision test.

## 10. Review checklist

- [ ] Repeated and familiar actions are icon-led.
- [ ] Primary, unfamiliar, and destructive actions retain labels.
- [ ] Navigation has consistent visual landmarks.
- [ ] Toolbars avoid repeated text where icons are established.
- [ ] Supporting prose has been shortened or structured where possible.
- [ ] Decorative icons do not add noise.
- [ ] One configured icon family and stroke style is used.
- [ ] Icon-only buttons have accessible names and tooltips.
- [ ] Statuses still have visible text.
- [ ] Responsive label hiding preserves comprehension.
- [ ] Touch targets and focus states remain accessible.
