export interface NotionTableLabels {
  more: string;
  display: string;
  data: string;
  structure: string;
  title: string;
  description: string;
  columnList: string;
  locked: string;
  reset: string;
  close: string;
  moveUp: (column: string) => string;
  moveDown: (column: string) => string;
}

export const defaultNotionTableLabels: NotionTableLabels = {
  more: 'More actions',
  display: 'Display',
  data: 'Data',
  structure: 'Structure',
  title: 'Display columns',
  description: 'Choose which columns to show and their order. This view is not saved.',
  columnList: 'Columns',
  locked: 'always shown',
  reset: 'Reset',
  close: 'Close',
  moveUp: (column) => `Move up: ${column}`,
  moveDown: (column) => `Move down: ${column}`,
};
