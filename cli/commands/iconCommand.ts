/**
 * Icon Update Command
 *
 * Converts an SVG file into all required icon formats for Electron applications:
 * - ICO files for Windows
 * - ICNS files for macOS
 * - PNG files for Linux (various sizes)
 * - Favicon files for web usage
 *
 * Usage:
 *   yarn g icons <input-svg> [output-dir]
 *   yarn g icons ./assets/app-icon.svg ./build/icons
 */
import { Command } from 'commander';
import { FileSystemService, GitUtils, IconUtils, type IconSizes } from '../utils/index.js';
import * as path from 'path';

export class IconGenerator {
  private inputSvg: string;
  private outputDir: string;
  private fileService: FileSystemService;
  private iconUtils: IconUtils;

  constructor(inputSvg: string, outputDir: string = './build/icons') {
    this.inputSvg = path.resolve(inputSvg);
    this.outputDir = path.resolve(outputDir);
    this.fileService = new FileSystemService();
    this.iconUtils = new IconUtils(this.fileService);
  }

  /**
   * Generate all icon formats from SVG
   */
  async generateAll(): Promise<void> {
    console.log('🎨 Generating icons from SVG...');
    console.log(`Input: ${this.inputSvg}`);
    console.log(`Output: ${this.outputDir}`);

    try {
      // Validate input file exists
      await this.fileService.fileExists(this.inputSvg);

      // Create output directory
      await this.fileService.ensureDir(this.outputDir);

      // Check dependencies
      const deps = await this.iconUtils.checkDependencies();
      if (!deps.sharp) {
        console.warn('⚠️  Sharp not found. Install with: yarn add -D sharp');
        return;
      }

      const sizes = IconUtils.getStandardSizes();

      // Generate PNG files for Linux
      console.log(`\n📦 Generating ${Object.keys(sizes.linux).length} PNG files...`);
      const pngFiles = await this.iconUtils.generatePngFiles(
        this.inputSvg,
        this.outputDir,
        sizes.linux,
        'linux'
      );
      pngFiles.forEach(file => {
        const relativePath = path.relative(this.outputDir, file);
        console.log(`  ✓ ${relativePath}`);
      });

      // Generate Windows ICO
      if (deps.pngToIco) {
        console.log('\n🪟 Generating Windows ICO file...');
        const icoFile = await this.iconUtils.generateIcoFile(
          this.inputSvg,
          this.outputDir,
          sizes.ico
        );
        console.log(`  ✓ ${path.basename(icoFile)}`);
      } else {
        console.warn('\n⚠️  Skipping ICO generation - png-to-ico not available');
      }

      // Generate macOS ICNS
      console.log('\n🍎 Generating macOS ICNS file...');
      const icnsResult = await this.iconUtils.generateIcnsFile(
        this.inputSvg,
        this.outputDir,
        sizes.icns
      );
      console.log(`  ✓ ${path.basename(icnsResult)}`);

      // Generate favicon package
      console.log('\n🌐 Generating favicon package...');
      await this.iconUtils.generateFaviconPackage(
        this.inputSvg,
        this.outputDir,
        sizes.favicon
      );
      console.log(`  ✓ favicon/ package`);

      console.log('\n✅ Icon generation completed successfully!');
      console.log('\n📁 Generated files:');
      await this.listGeneratedFiles();

    } catch (error) {
      console.error('\n❌ Error generating icons:', error);
      throw error;
    }
  }

  /**
   * List all generated files
   */
  private async listGeneratedFiles(): Promise<void> {
    try {
      const files = await this.fileService.findFiles(this.outputDir, {
        pattern: /\.(png|ico|icns|json)$/i,
        excludeDirs: ['.temp']
      });

      const sortedFiles = files
        .sort()
        .map((file: string) => `   ${path.relative(this.outputDir, file)}`);

      console.log(sortedFiles.join('\n'));
    } catch (error) {
      console.error('Could not list generated files:', error);
    }
  }
}

/**
 * Complete app icon replacement command
 */
export const iconCommand = new Command('icons')
  .description('Replace ALL application icons and branding with new SVG')
  .argument('<input-svg>', 'Path to new app icon SVG file')
  .argument('[output-dir]', 'Output directory for generated icons', './build/icons')
  .option('-f, --force', 'Overwrite existing files', false)
  .option('--dry-run', 'Show what would be updated without making changes', false)
  .option('--no-replace', 'Only generate icon formats, don\'t replace existing assets', false)
  .option('--git-add', 'Automatically add generated icons to Git', false)
  .action(async (inputSvg: string, outputDir: string, options) => {
    try {
      console.log('🎨 Complete App Icon Replacement');
      console.log('=================================');

      if (options.dryRun) {
        console.log('\n🔍 Dry run mode - no files will be modified');
        console.log(`\n📱 Input SVG: ${path.resolve(inputSvg)}`);

        if (!options.noReplace) {
          console.log('\n🔄 Files that will be replaced:');
          console.log('  • public/system-tray.svg (tray icon)');
          console.log('  • public/app-favicon.svg (favicon)');
          console.log('  • ui/assets/app-logo.svg (UI component icon)');
          console.log('\n⚙️  Configuration that will be updated:');
          console.log('  • SystemTrayService.ts (icon reference)');
          console.log('  • index.html (favicon reference)');
          console.log('  • package.json (build icon paths)');
        }

        console.log('\n📦 Icon formats that will be generated:');
        console.log('  • PNG files for Linux (16x16 to 1024x1024)');
        console.log('  • ICO file for Windows');
        console.log('  • ICNS file for macOS');
        console.log('  • Favicon package for web usage');
        return;
      }

      const replacer = new IconReplacer(inputSvg, outputDir);

      // Always generate the icon formats
      await replacer.generateIcons();

      // Replace all existing assets unless disabled
      if (!options.noReplace) {
        await replacer.replaceAll();
      }

      // Add to Git if requested
      if (options.gitAdd) {
        await replacer.addToGit();
      }

      console.log('\n✅ Icon replacement completed successfully!');

      if (!options.noReplace) {
        console.log('\n📋 Summary of changes:');
        await replacer.showSummary();
      }

      console.log('\n💡 Next steps:');
      console.log('  1. Test the application: yarn dev');
      console.log('  2. Build to verify all icons: yarn build');
      console.log('  3. Check tray icon, favicon, and app icons are updated');

      if (!options.gitAdd) {
        console.log('  4. Commit the generated icons: git add build/icons/ && git commit -m "Update app icons"');
      } else {
        console.log('  4. Icons already added to Git - commit when ready: git commit -m "Update app icons"');
      }

    } catch (error) {
      console.error('\n❌ Icon replacement failed:', error);
      console.log('\n💡 Troubleshooting:');
      console.log('  • Ensure the input SVG file exists and is readable');
      console.log('  • Install required dependencies: yarn add -D sharp png-to-ico');
      console.log('  • For ICNS generation on macOS, install Xcode command line tools');
      process.exit(1);
    }
  });

export class IconReplacer {
  private inputSvg: string;
  private outputDir: string;
  private changes: string[] = [];
  private fileService: FileSystemService;
  private gitUtils: GitUtils;

  constructor(inputSvg: string, outputDir: string) {
    this.inputSvg = path.resolve(inputSvg);
    this.outputDir = path.resolve(outputDir);
    this.fileService = new FileSystemService();
    this.gitUtils = new GitUtils();
  }

  async generateIcons(): Promise<void> {
    console.log('\n📦 Generating app icon formats...');
    const generator = new IconGenerator(this.inputSvg, this.outputDir);
    await generator.generateAll();
    this.changes.push(`Generated icons in ${this.outputDir}`);
  }

  async replaceAll(): Promise<void> {
    console.log('\n🔄 Replacing all application icons...');

    await this.replacePublicAssets();
    await this.replaceUIAssets();
    await this.updateCodeReferences();
    await this.updateConfiguration();
  }

  private async replacePublicAssets(): Promise<void> {
    console.log('  🌐 Updating public assets...');

    // Replace system-tray.svg (used by system tray)
    await this.fileService.copyFile(this.inputSvg, 'public/system-tray.svg');
    this.changes.push('Replaced public/system-tray.svg (system tray icon)');

    // Replace app-favicon.svg (favicon in browser)
    await this.fileService.copyFile(this.inputSvg, 'public/app-favicon.svg');
    this.changes.push('Replaced public/app-favicon.svg (favicon)');

    // Keep electron-vite.animate.svg as-is since it's animated
    console.log('    ℹ️  Kept public/electron-vite.animate.svg (animated)');
  }

  private async replaceUIAssets(): Promise<void> {
    console.log('  🎨 Updating UI assets...');

    // Replace app-logo.svg in UI assets
    await this.fileService.copyFile(this.inputSvg, 'ui/assets/app-logo.svg');
    this.changes.push('Replaced ui/assets/app-logo.svg (UI component icon)');
  }

  private async updateCodeReferences(): Promise<void> {
    console.log('  📱 Updating code references...');

    // Update SystemTrayService to ensure it references the correct file
    const wasTrayUpdated = await this.fileService.replaceInFile(
      'main/services/SystemTrayService.ts',
      /const iconPath = path\.join\(process\.env\.VITE_PUBLIC \|\| \'\', '[^']+'\);/,
      "const iconPath = path.join(process.env.VITE_PUBLIC || '', 'system-tray.svg');"
    );

    if (wasTrayUpdated) {
      this.changes.push('Updated SystemTrayService.ts icon reference');
    }

    // Update HTML favicon reference
    const wasHtmlUpdated = await this.fileService.replaceInFile(
      'index.html',
      /<link rel="icon" type="image\/svg\+xml" href="[^"]*" \/>/,
      '<link rel="icon" type="image/svg+xml" href="/app-favicon.svg" />'
    );

    if (wasHtmlUpdated) {
      this.changes.push('Updated index.html favicon reference');
    }
  }

  private async updateConfiguration(): Promise<void> {
    console.log('  ⚙️  Updating configuration...');

    try {
      const packageData = await this.fileService.readJson('package.json') as any;

      // Ensure build configuration includes icon paths
      if (!packageData.build) {
        packageData.build = {};
      }

      if (!packageData.build.files) {
        packageData.build.files = ['build/**/*', 'dist/**/*'];
      }

      // Update icon paths for different platforms
      if (!packageData.build.dmg) {
        packageData.build.dmg = {};
      }
      packageData.build.dmg.icon = 'build/icons/icon.icns';

      if (!packageData.build.mac) {
        packageData.build.mac = {};
      }
      packageData.build.mac.icon = 'build/icons/icon.icns';

      if (!packageData.build.win) {
        packageData.build.win = {};
      }
      packageData.build.win.icon = 'build/icons/icon.ico';

      if (!packageData.build.linux) {
        packageData.build.linux = {};
      }
      packageData.build.linux.icon = 'build/icons/linux/';

      await this.fileService.writeFile('package.json', JSON.stringify(packageData, null, 2) + '\n');
      this.changes.push('Updated package.json build configuration with icon paths');
    } catch (error) {
      console.warn('    ⚠️  Failed to update package.json:', error instanceof Error ? error.message : error);
      this.changes.push('Failed to update package.json');
    }
  }

  async showSummary(): Promise<void> {
    console.log('\n📋 Changes made:');
    this.changes.forEach((change, index) => {
      console.log(`  ${index + 1}. ${change}`);
    });

    console.log('\n📁 Generated icon files:');
    try {
      const iconFiles = await this.fileService.findFiles(this.outputDir, {
        pattern: /\.(png|ico|icns|json)$/i,
        excludeDirs: ['.temp']
      });

      const sortedFiles = iconFiles
        .sort()
        .map(file => `  • ${path.relative(process.cwd(), file)}`);

      console.log(sortedFiles.join('\n'));
    } catch (error) {
      console.log('  (Could not list generated files)');
    }

    console.log('\n🎯 What was updated:');
    console.log('  • System tray icon (macOS menu bar)');
    console.log('  • Browser favicon');
    console.log('  • UI component icons');
    console.log('  • Windows app icon (.ico)');
    console.log('  • macOS app icon (.icns)');
    console.log('  • Linux app icons (.png)');
    console.log('  • Electron build configuration');
  }

  async addToGit(): Promise<void> {
    console.log('  📝 Adding icons to Git...');
    try {
      if (!(await this.gitUtils.isInGitRepo())) {
        console.warn('    ⚠️  Not in a Git repository');
        this.changes.push('Not in a Git repository');
        return;
      }

      const gitChanges = await this.gitUtils.addWithSummary('build/icons/');
      this.changes.push(...gitChanges);

      gitChanges.forEach(change => {
        console.log(`    ✓ ${change}`);
      });
    } catch (error) {
      console.warn('    ⚠️  Could not automatically add to Git:', error instanceof Error ? error.message : error);
      this.changes.push('Failed to add icons to Git automatically');
    }
  }
}