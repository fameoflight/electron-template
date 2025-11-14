import { app, nativeImage, BrowserWindow } from 'electron';
import * as path from 'node:path';

/**
 * Icon management service
 *
 * Handles all icon-related functionality including:
 * - Window icons
 * - Dock icons (macOS)
 * - System tray icons
 * - Icon path resolution
 */
export class IconService {
  private static instance: IconService | null = null;
  private appRoot: string;

  constructor() {
    this.appRoot = process.env.APP_ROOT || process.cwd();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): IconService {
    if (!IconService.instance) {
      IconService.instance = new IconService();
    }
    return IconService.instance;
  }

  /**
   * Get window icon path for current platform
   */
  getWindowIconPath(): string {
    if (process.platform === 'darwin') {
      // macOS prefers ICNS for window icons
      return path.join(this.appRoot, 'build', 'icons', 'icon.icns');
    } else if (process.platform === 'win32') {
      // Windows prefers ICO files
      return path.join(this.appRoot, 'build', 'icons', 'icon.ico');
    } else {
      // Linux uses PNG
      return path.join(this.appRoot, 'build', 'icons', 'linux', 'icon-256x256.png');
    }
  }

  /**
   * Get system tray icon path for current platform
   */
  getSystemTrayIconPath(): string {
    if (process.platform === 'darwin') {
      // macOS supports high-resolution PNG icons - use template image for monochrome appearance
      return path.join(this.appRoot, 'build', 'icons', 'linux', 'icon-16x16.png');
    } else if (process.platform === 'win32') {
      // Windows prefers ICO files
      return path.join(this.appRoot, 'build', 'icons', 'icon.ico');
    } else {
      // Linux uses PNG
      return path.join(this.appRoot, 'build', 'icons', 'linux', 'icon-16x16.png');
    }
  }

  /**
   * Create a fallback icon when file loading fails
   */
  createFallbackIcon(type: 'tray' | 'dock' = 'tray'): Electron.NativeImage {
    const size = type === 'tray'
      ? (process.platform === 'win32' ? 16 : 22) // System tray sizes
      : 512; // Dock icon size

    // Create different fallback colors for different types
    let base64Icon: string;
    if (process.platform === 'darwin' && type === 'tray') {
      // Black for macOS tray template image
      base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    } else if (type === 'dock') {
      // Red for dock icons (easy to spot)
      base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    } else {
      // Blue for tray icons on other platforms
      base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }

    const icon = nativeImage.createFromDataURL(base64Icon);

    // Resize to appropriate size
    return icon.resize({
      width: size,
      height: size
    });
  }

  /**
   * Load an icon from file path with fallback
   */
  async loadIcon(iconPath: string, type: 'tray' | 'dock' = 'tray'): Promise<Electron.NativeImage> {
    try {
      console.log(`[IconService] Loading ${type} icon from: ${iconPath}`);

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(iconPath)) {
        throw new Error(`File does not exist: ${iconPath}`);
      }

      // Get file stats for debugging
      const stats = fs.statSync(iconPath);
      console.log(`[IconService] File exists, size: ${stats.size} bytes`);

      // Create native image
      const icon = nativeImage.createFromPath(iconPath);
      console.log(`[IconService] Created ${type} image: empty=${icon.isEmpty()}, size=${icon.getSize()}`);

      if (icon.isEmpty()) {
        throw new Error(`Icon is empty: ${iconPath}`);
      }

      // For macOS tray icons, set as template image for proper dark/light mode support
      if (process.platform === 'darwin' && type === 'tray') {
        icon.setTemplateImage(true);
      }

      return icon;
    } catch (error) {
      console.warn(`[IconService] Failed to load ${type} icon from ${iconPath}:`, error instanceof Error ? error.message : error);

      // Create fallback icon
      const fallbackIcon = this.createFallbackIcon(type);

      // For macOS tray icons, set as template image
      if (process.platform === 'darwin' && type === 'tray') {
        fallbackIcon.setTemplateImage(true);
      }

      console.log(`[IconService] Using fallback ${type} icon`);
      return fallbackIcon;
    }
  }

  /**
   * Set up dock icon for macOS
   */
  async setupDockIcon(): Promise<void> {
    if (process.platform !== 'darwin') {
      console.log('[IconService] Not on macOS, skipping dock icon setup');
      return;
    }

    // Wait a bit for app to be ready
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!app.dock) {
      console.warn('[IconService] app.dock is not available');
      return;
    }

    console.log('[IconService] Setting macOS dock icon...');

    // For macOS dock, try ICNS first as it's the native format
    const iconPaths = [
      path.join(this.appRoot, 'build', 'icons', 'icon.icns'), // ICNS is best for macOS dock
      path.join(this.appRoot, 'build', 'icons', 'linux', 'icon-512x512.png'), // High-res PNG fallback
      path.join(this.appRoot, 'build', 'icons', 'linux', 'icon-256x256.png'), // Medium-res PNG fallback
    ];

    for (const iconPath of iconPaths) {
      try {
        console.log(`[IconService] Trying dock icon: ${iconPath}`);

        // For ICNS files, try direct loading without the loadIcon wrapper first
        if (iconPath.endsWith('.icns')) {
          try {
            const fs = await import('fs');
            if (fs.existsSync(iconPath)) {
              console.log(`[IconService] Direct loading ICNS file...`);
              const icon = nativeImage.createFromPath(iconPath);
              if (!icon.isEmpty()) {
                app.dock.setIcon(icon);
                console.log(`✅ [IconService] macOS dock icon set directly from ICNS: ${path.basename(iconPath)}`);
                return;
              } else {
                console.log(`[IconService] ICNS file loaded but was empty`);
              }
            }
          } catch (icnsError) {
            console.log(`[IconService] Direct ICNS loading failed: ${icnsError}`);
          }
        }

        // Fallback to loadIcon method for PNG files
        const icon = await this.loadIcon(iconPath, 'dock');

        if (!icon.isEmpty()) {
          console.log(`[IconService] Dock icon loaded via loadIcon, setting on app.dock...`);
          app.dock.setIcon(icon);
          console.log(`✅ [IconService] macOS dock icon set successfully from: ${path.basename(iconPath)}`);
          return;
        } else {
          console.log(`[IconService] Dock icon was empty, trying next...`);
        }
      } catch (error) {
        console.warn(`⚠️ [IconService] Failed to set dock icon from ${path.basename(iconPath)}:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    console.warn('❌ [IconService] Failed to set any dock icon');
  }

  /**
   * Set up dock icon after window creation (sometimes timing matters)
   */
  async setupDockIconAfterWindowCreation(): Promise<void> {
    if (process.platform !== 'darwin') {
      console.log('[IconService] Not on macOS, skipping post-window dock icon setup');
      return;
    }

    if (!app.dock) {
      console.warn('[IconService] app.dock is not available for post-window setup');
      return;
    }

    console.log('[IconService] Re-attempting dock icon after window creation...');

    try {
      // Try the highest resolution PNG first
      const iconPath = path.join(this.appRoot, 'build', 'icons', 'linux', 'icon-512x512.png');
      console.log(`[IconService] Post-window trying dock icon: ${iconPath}`);

      const icon = await this.loadIcon(iconPath, 'dock');

      if (!icon.isEmpty()) {
        console.log(`[IconService] Post-window dock icon loaded, setting...`);
        app.dock.setIcon(icon);
        console.log('✅ [IconService] macOS dock icon set (post-window creation)');
      } else {
        console.log(`[IconService] Post-window dock icon was empty`);
      }
    } catch (error) {
      console.warn('⚠️ [IconService] Failed post-window dock icon setup:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Get window icon configuration for BrowserWindow constructor
   */
  async getWindowIconOptions(): Promise<{ icon?: string }> {
    const iconPath = this.getWindowIconPath();

    // Check if file exists before including in options
    try {
      const fs = await import('fs');
      if (fs.existsSync(iconPath)) {
        console.log(`[IconService] Window icon found: ${iconPath}`);
        return { icon: iconPath };
      } else {
        console.log(`[IconService] Window icon not found: ${iconPath}`);
      }
    } catch (error) {
      console.warn('[IconService] Could not verify window icon path:', error);
    }

    return {};
  }
}