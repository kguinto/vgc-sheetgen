// The ids that let each tab and its panel point at each other, for screen
// readers. Kept apart from `Tabs.tsx`, which only exports the component.

/**
 * The attributes for tab `id`'s panel. Panels of other tabs are hidden
 * rather than removed, so what's in them (e.g. a PDF preview) isn't loaded
 * again when switching back.
 */
export function tabPanelProps(idPrefix: string, id: string, active: string) {
  return {
    role: 'tabpanel',
    id: panelId(idPrefix, id),
    'aria-labelledby': tabId(idPrefix, id),
    hidden: id !== active,
  } as const;
}

/** The id of tab `id`'s button. */
export const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;

/** The id of tab `id`'s panel. */
export const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;
