mockup link: https://www.figma.com/make/i6Ld3HUlr5FQcxpUcbpvJu/Design-Admin-Page?t=6NSJ5IqPrBynRweO-1

## Role deletion feedback (`RBAC-001`)

- Keep the existing destructive confirmation dialog for custom roles.
- After deletion and list refresh complete, show the global Sonner success toast with `Role deleted successfully`.
- Do not show the success toast while the request is pending or on any failure.
- The deleted role card is absent when the toast appears, so visible state and feedback cannot contradict each other.
- System-role delete actions remain disabled.
