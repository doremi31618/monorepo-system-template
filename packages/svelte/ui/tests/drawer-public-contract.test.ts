import { describe, expect, test } from 'bun:test';

import * as Drawer from '../src/lib/ui/drawer/index.js';

describe('drawer public package contract', () => {
  test('exports the accessible bottom-drawer composition used by responsive editors', () => {
    expect(Object.keys(Drawer).sort()).toEqual([
      'Close',
      'Content',
      'Description',
      'Drawer',
      'DrawerClose',
      'DrawerContent',
      'DrawerDescription',
      'DrawerFooter',
      'DrawerHeader',
      'DrawerNestedRoot',
      'DrawerOverlay',
      'DrawerPortal',
      'DrawerTitle',
      'DrawerTrigger',
      'Footer',
      'Header',
      'NestedRoot',
      'Overlay',
      'Portal',
      'Root',
      'Title',
      'Trigger',
    ]);
  });
});
