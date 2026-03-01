// import React from 'react';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';

import styles from './Footer.module.css';
import { Text } from 'lucide-react';

export default function Footer() {
  return (
    <NavigationMenu.Root className={styles['navigation-menu-root']}>
      <NavigationMenu.List className={styles['navigation-menu-list']}>
        <NavigationMenu.Item>
          <Text to="/" className={styles['logo']}>
            📚 ELibrary 2026
          </Text>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <div className={styles['viewport-position']}>
        <NavigationMenu.Viewport
          className={styles['navigation-menu-viewport']}
        />
      </div>
    </NavigationMenu.Root>
  );
}
