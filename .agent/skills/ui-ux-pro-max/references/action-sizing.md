# Action Sizing and Button Width

Use this reference when designing or reviewing buttons, form actions, card actions, toolbars,
dialogs, sheets, onboarding flows, and responsive calls to action.

## Contents

1. Default rule
2. Width hierarchy
3. Action placement
4. Flex and grid stretch
5. Labels and responsive behavior
6. shadcn-svelte pattern
7. Review checklist

## Default rule

Keep desktop buttons content-sized by default. Let the label, icon, and horizontal padding define
the width.

Use full-width buttons only when width communicates a real layout or task relationship:

- A single primary action in a narrow authentication, onboarding, or checkout form
- A mobile bottom action or narrow-screen action where full width improves reach and clarity
- A segmented or button-group control whose children intentionally share available width
- A destructive confirmation layout explicitly designed around one unavoidable action

Do not make a button full width merely because its parent is full width.

## Width hierarchy

Choose width from the interaction context:

| Context | Preferred width |
| --- | --- |
| Desktop card or settings form | Content width |
| Desktop toolbar | Content width |
| Table row action | Content width or icon button |
| Dialog footer | Content width inside an action row |
| Multi-action form | Content width with primary and secondary grouped |
| Narrow authentication form | Full width may be appropriate |
| Mobile single primary action | Full width or container width |
| Mobile multiple actions | Stack or wrap according to priority |

Keep button height and padding consistent with the design system. Do not compensate for a long
container by increasing button width.

## Action placement

Group form actions in a dedicated action row:

- Use `display: flex`.
- Allow wrapping when translated labels may grow.
- Keep consistent gaps.
- Place the primary action after secondary actions in DOM order when the visual layout puts it on
  the inline end.
- Align routine desktop submission actions to the inline start or end according to the product's
  established form convention.
- Keep destructive actions visually separated from routine actions.

Do not leave a submit button as an unguarded direct child of a stretching column container.

## Flex and grid stretch

Check the parent before adding width utilities.

Column flex containers default to `align-items: stretch`. Grid items also stretch by default.
Therefore a content-sized button may appear full width even without `w-full`.

Prevent accidental stretching with one of these patterns:

- Wrap actions in `display: flex`.
- Apply `align-self: flex-start` or `align-self: flex-end` as a layout decision.
- Configure the parent with a non-stretching alignment only when all children should follow it.
- Use a semantic Card footer or form action region when available.

Do not change the shared Button base component to counter one parent's layout behavior.

## Labels and responsive behavior

Write concise verb-led labels:

- Prefer `Queue sync` over `Queue account synchronization operation`.
- Preserve necessary domain meaning; do not shorten labels into ambiguity.
- Let labels wrap only in exceptional mobile or localization cases.
- Test long translations before enforcing fixed widths.
- Keep icon-only buttons for familiar actions with accessible names, not for complex commitments.

At narrow widths:

- Allow a content-sized button to become full width when it prevents crowding.
- Stack multiple actions with clear priority.
- Keep touch targets at least 44×44 CSS pixels.
- Avoid horizontal scrolling caused by untranslated button labels.

## shadcn-svelte pattern

Use a dedicated action row inside a vertical field group:

```svelte
<Field.FieldGroup>
	<!-- fields and supporting content -->
	<div class="flex flex-wrap items-center justify-end gap-2">
		<Button type="button" variant="outline">Cancel</Button>
		<Button type="submit">Queue synchronization</Button>
	</div>
</Field.FieldGroup>
```

For one start-aligned action:

```svelte
<Button type="submit" class="self-start">Create account</Button>
```

Use `class` only for layout behavior such as `self-start`; keep visual styling in Button variants.

## Review checklist

- [ ] Desktop buttons are content-sized unless the workflow justifies full width.
- [ ] Full width communicates hierarchy instead of filling incidental space.
- [ ] Action rows define alignment, wrapping, and gaps.
- [ ] Flex or grid stretch is not changing button width accidentally.
- [ ] The shared Button component remains intrinsically sized.
- [ ] Labels are concise, verb-led, and localization-safe.
- [ ] Mobile width behavior is tested independently from desktop.
- [ ] Multiple actions preserve visible priority.
- [ ] Touch targets and focus indicators remain accessible.
