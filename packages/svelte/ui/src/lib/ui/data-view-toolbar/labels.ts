import type { DataViewFilterOperator } from './query.js';

export interface DataViewToolbarLabels {
  addFilter: string;
  filter: string;
  filterDescription: string;
  filterBy: string;
  confirmFilter: string;
  sort: string;
  sortDescription: string;
  sortBy: string;
  addSort: string;
  search: string;
  searchPlaceholder: string;
  clearSearch: string;
  clearAll: string;
  searchOptionsPlaceholder: string;
  loadingOptions: string;
  retry: string;
  noOptions: string;
  booleanTrue: string;
  booleanFalse: string;
  operators: Record<DataViewFilterOperator, string>;
}

export type DataViewToolbarLabelOverrides = Partial<
  Omit<DataViewToolbarLabels, 'operators'>
> & {
  operators?: Partial<DataViewToolbarLabels['operators']>;
};

export const defaultDataViewToolbarLabels: DataViewToolbarLabels = {
  addFilter: 'Add filter',
  filter: 'Filter',
  filterDescription: 'Choose a property, operator, and value.',
  filterBy: 'Filter by',
  confirmFilter: 'Confirm filter',
  sort: 'Sort',
  sortDescription: 'Earlier rules have higher priority.',
  sortBy: 'Sort by',
  addSort: 'Add sort',
  search: 'Search',
  searchPlaceholder: 'Search…',
  clearSearch: 'Clear search',
  clearAll: 'Clear all',
  searchOptionsPlaceholder: 'Search options…',
  loadingOptions: 'Loading options…',
  retry: 'Retry',
  noOptions: 'No options found.',
  booleanTrue: 'True',
  booleanFalse: 'False',
  operators: {
    is: 'is',
    isNot: 'is not',
    isAnyOf: 'is any of',
    before: 'before',
    after: 'after',
    between: 'between',
  },
};
