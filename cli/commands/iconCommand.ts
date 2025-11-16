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
import { cyberOutput } from '../utils/output.js';
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
    cyberOutput.info('Generating icons from SVG...');
    cyberOutput.info(`Input: ${this.inputSvg}`);
    cyberOutput.info(`Output: ${this.outputDir}`);

    try {
      // Validate input file exists
      await this.fileService.fileExists(this.inputSvg);

      // Create output directory
      await this.fileService.ensureDir(this.outputDir);

      // Check dependencies
      const deps = await this.iconUtils.checkDependencies();
      if (!deps.sharp) {
        cyberOutput.warning('Sharp not found. Install with: yarn add -D sharp');
        return;
      }

      const sizes = IconUtils.getStandardSizes();

      // Generate PNG files for Linux
      cyberOutput.info(`Generating ${Object.keys(sizes.linux).length} PNG files...`);
      const pngFiles = await this.iconUtils.generatePngFiles(
        this.inputSvg,
        this.outputDir,
        sizes.linux,
        'linux'
      );
      pngFiles.forEach(file => {
        const relativePath = path.relative(this.outputDir, file);
        cyberOutput.success(`Created ${relativePath}`);
      });

      // Generate Windows ICO
      if (deps.pngToIco) {
        cyberOutput.info('Generating Windows ICO file...');
        const icoFile = await this.iconUtils.generateIcoFile(
          this.inputSvg,
          this.outputDir,
          sizes.ico
        );
        cyberOutput.success(`Created ${path.basename(icoFile)}`);
      } else {
        cyberOutput.warning('Skipping ICO generation - png-to-ico not available');
      }

      // Generate macOS ICNS
      cyberOutput.info('Generating macOS ICNS file...');
      const icnsResult = await this.iconUtils.generateIcnsFile(
        this.inputSvg,
        this.outputDir,
        sizes.icns
      );
      cyberOutput.success(`Created ${path.basename(icnsResult)}`);

      // Generate favicon package
      cyberOutput.info('Generating favicon package...');
      await this.iconUtils.generateFaviconPackage(
        this.inputSvg,
        this.outputDir,
        sizes.favicon
      );
      cyberOutput.success('Created favicon/ package');

      cyberOutput.success('Icon generation completed successfully!');
      cyberOutput.info('Generated files:');
      await this.listGeneratedFiles();

    } catch (error) {
      cyberOutput.error('Error generating icons:', error instanceof Error ? error.message : String(error));
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

      cyberOutput.info(sortedFiles.join('\n'));
    } catch (error) {
      cyberOutput.error('Could not list generated files:', error instanceof Error ? error.message : String(error));
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
      cyberOutput.header('Complete App Icon Replacement');

      if (options.dryRun) {
        cyberOutput.info('Dry run mode - no files will be modified');
        cyberOutput.info(`Input SVG: ${path.resolve(inputSvg)}`);

        if (!options.noReplace) {
          cyberOutput.info('Files that will be replaced:');
          cyberOutput.info('• public/system-tray.svg (tray icon)');
          cyberOutput.info('• public/app-favicon.svg (favicon)');
          cyberOutput.info('• ui/assets/app-logo.svg (UI component icon)');
          cyberOutput.info('Configuration that will be updated:');
          cyberOutput.info('• SystemTrayService.ts (icon reference)');
          cyberOutput.info('• index.html (favicon reference)');
          cyberOutput.info('• package.json (build icon paths)');
        }

        cyberOutput.info('Icon formats that will be generated:');
        cyberOutput.info('• PNG files for Linux (16x16 to 1024x1024)');
        cyberOutput.info('• ICO file for Windows');
        cyberOutput.info('• ICNS file for macOS');
        cyberOutput.info('• Favicon package for web usage');
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

      cyberOutput.success('Icon replacement completed successfully!');

      if (!options.noReplace) {
        cyberOutput.info('Summary of changes:');
        await replacer.showSummary();
      }

      cyberOutput.info('Next steps:');
      cyberOutput.info('1. Test the application: yarn dev');
      cyberOutput.info('2. Build to verify all icons: yarn build');
      cyberOutput.info('3. Check tray icon, favicon, and app icons are updated');

      if (!options.gitAdd) {
        cyberOutput.info('4. Commit the generated icons: git add build/icons/ && git commit -m "Update app icons"');
      } else {
        cyberOutput.info('4. Icons already added to Git - commit when ready: git commit -m "Update app icons"');
      }

    } catch (error) {
      cyberOutput.error('Icon replacement failed:', error instanceof Error ? error.message : String(error));
      cyberOutput.info('Troubleshooting:');
      cyberOutput.info('• Ensure the input SVG file exists and is readable');
      cyberOutput.info('• Install required dependencies: yarn add -D sharp png-to-ico');
      cyberOutput.info('• For ICNS generation on macOS, install Xcode command line tools');
      process.exit(1);
    }
  });

// eslint-disable-next-line @codeblocks/class-props-limit
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
    cyberOutput.info('Generating app icon formats...');
    const generator = new IconGenerator(this.inputSvg, this.outputDir);
    await generator.generateAll();
    this.changes.push(`Generated icons in ${this.outputDir}`);
  }

  async replaceAll(): Promise<void> {
    cyberOutput.info('Replacing all application icons...');

    await this.replacePublicAssets();
    await this.replaceUIAssets();
    await this.updateCodeReferences();
    await this.updateConfiguration();
  }

  private async replacePublicAssets(): Promise<void> {
    cyberOutput.info('Updating public assets...');

    // Replace system-tray.svg (used by system tray)
    await this.fileService.copyFile(this.inputSvg, 'public/system-tray.svg');
    this.changes.push('Replaced public/system-tray.svg (system tray icon)');

    // Replace app-favicon.svg (favicon in browser)
    await this.fileService.copyFile(this.inputSvg, 'public/app-favicon.svg');
    this.changes.push('Replaced public/app-favicon.svg (favicon)');

    // Keep electron-vite.animate.svg as-is since it's animated
    cyberOutput.info('Kept public/electron-vite.animate.svg (animated)');
  }

  private async replaceUIAssets(): Promise<void> {
    cyberOutput.info('Updating UI assets...');

    // Replace app-logo.svg in UI assets
    await this.fileService.copyFile(this.inputSvg, 'ui/assets/app-logo.svg');
    this.changes.push('Replaced ui/assets/app-logo.svg (UI component icon)');
  }

  private async updateCodeReferences(): Promise<void> {
    cyberOutput.info('Updating code references...');

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
    cyberOutput.info('Updating configuration...');

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
      cyberOutput.warning('Failed to update package.json:', error instanceof Error ? error.message : String(error));
      this.changes.push('Failed to update package.json');
    }
  }

  async showSummary(): Promise<void> {
    cyberOutput.info('Changes made:');
    this.changes.forEach((change, index) => {
      cyberOutput.logger.log(`${index + 1}. ${change}`);
    });

    cyberOutput.info('Generated icon files:');
    try {
      const iconFiles = await this.fileService.findFiles(this.outputDir, {
        pattern: /\.(png|ico|icns|json)$/i,
        excludeDirs: ['.temp']
      });

      const sortedFiles = iconFiles
        .sort()
        .map(file => `  • ${path.relative(process.cwd(), file)}`);

      cyberOutput.info(sortedFiles.join('\n'));
    } catch (error) {
      cyberOutput.info('(Could not list generated files)');
    }

    cyberOutput.info('What was updated:');
    cyberOutput.info('• System tray icon (macOS menu bar)');
    cyberOutput.info('• Browser favicon');
    cyberOutput.info('• UI component icons');
    cyberOutput.info('• Windows app icon (.ico)');
    cyberOutput.info('• macOS app icon (.icns)');
    cyberOutput.info('• Linux app icons (.png)');
    cyberOutput.info('• Electron build configuration');
  }

  async addToGit(): Promise<void> {
    cyberOutput.info('Adding icons to Git...');
    try {
      if (!(await this.gitUtils.isInGitRepo())) {
        cyberOutput.warning('Not in a Git repository');
        this.changes.push('Not in a Git repository');
        return;
      }

      const gitChanges = await this.gitUtils.addWithSummary('build/icons/');
      this.changes.push(...gitChanges);

      gitChanges.forEach(change => {
        cyberOutput.success(`Added ${change}`);
      });
    } catch (error) {
      cyberOutput.warning('Could not automatically add to Git:', error instanceof Error ? error.message : String(error));
      this.changes.push('Failed to add icons to Git automatically');
    }
  }
}