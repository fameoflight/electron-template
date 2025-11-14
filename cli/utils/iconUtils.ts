/**
 * Icon processing utility functions
 */
import { FileSystemService, writeFile } from './FileSystemService';
import * as path from 'path';
import * as fs from 'fs/promises';

// Optional dependencies will be imported dynamically when needed

export interface IconSizes {
  [key: string]: number;
}

export interface IconFormat {
  name: string;
  sizes: number[];
  extension: string;
  platform: string;
}

export class IconUtils {
  private fileService: FileSystemService;

  constructor(fileService: FileSystemService = new FileSystemService()) {
    this.fileService = fileService;
  }

  /**
   * Check if required dependencies are available
   */
  async checkDependencies(): Promise<{ sharp: boolean; pngToIco: boolean }> {
    let sharpAvailable = false;
    let pngToIcoAvailable = false;

    try {
      await import('sharp');
      sharpAvailable = true;
    } catch {
      // Sharp not available
    }

    try {
      await import('png-to-ico');
      pngToIcoAvailable = true;
    } catch {
      // png-to-ico not available
    }

    return {
      sharp: sharpAvailable,
      pngToIco: pngToIcoAvailable
    };
  }

  /**
   * Generate PNG files from SVG for specified sizes
   */
  async generatePngFiles(
    inputSvg: string,
    outputDir: string,
    sizes: IconSizes,
    subfolder: string = ''
  ): Promise<string[]> {
    const sharpModule = await import('sharp').catch(() => null);
    if (!sharpModule) {
      throw new Error('Sharp is required for PNG generation. Install with: yarn add -D sharp');
    }

    const targetDir = subfolder ? path.join(outputDir, subfolder) : outputDir;
    await this.fileService.ensureDir(targetDir);

    const generatedFiles: string[] = [];

    const promises = Object.entries(sizes).map(async ([name, size]) => {
      const filename = name === '512x512' ? 'icon.png' : `icon-${name}.png`;
      const outputPath = path.join(targetDir, filename);

      try {
        await sharpModule.default(inputSvg)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            compressionLevel: 9,
            quality: 100
          })
          .toFile(outputPath);

        generatedFiles.push(outputPath);
        return { success: true, file: outputPath };
      } catch (error) {
        throw new Error(`Failed to generate ${name}: ${error}`);
      }
    });

    await Promise.all(promises);
    return generatedFiles;
  }

  /**
   * Generate ICO file from PNG files
   */
  async generateIcoFile(
    inputSvg: string,
    outputDir: string,
    sizes: number[] = [16, 32, 48, 256]
  ): Promise<string> {
    const [sharpModule, pngToIcoModule] = await Promise.all([
      import('sharp').catch(() => null),
      import('png-to-ico').catch(() => null)
    ]);

    if (!sharpModule || !pngToIcoModule) {
      throw new Error('Sharp and png-to-ico are required for ICO generation');
    }

    // Create temporary directory for intermediate PNGs
    const tempDir = path.join(outputDir, '.temp');
    await this.fileService.ensureDir(tempDir);

    try {
      // Generate temporary PNG files
      const tempPngPaths = await Promise.all(
        sizes.map(size => this.generateTempPng(inputSvg, tempDir, size, sharpModule))
      );

      // Convert PNGs to ICO
      const icoBuffer = await pngToIcoModule.default(tempPngPaths);
      const icoPath = path.join(outputDir, 'icon.ico');

      await fs.writeFile(icoPath, icoBuffer);

      // Clean up temporary files
      await Promise.all(tempPngPaths.map(p => this.fileService.safeRemove(p)));
      await this.fileService.safeRemove(tempDir);

      return icoPath;
    } catch (error) {
      await this.fileService.safeRemove(tempDir);
      throw new Error(`Failed to generate ICO: ${error}`);
    }
  }

  /**
   * Generate ICNS file (macOS icon format)
   */
  async generateIcnsFile(
    inputSvg: string,
    outputDir: string,
    sizes: number[] = [16, 32, 64, 128, 256, 512, 1024]
  ): Promise<string> {
    const sharpModule = await import('sharp').catch(() => null);
    if (!sharpModule) {
      throw new Error('Sharp is required for ICNS generation');
    }

    const iconsetDir = path.join(outputDir, '.temp', 'icon.iconset');
    await this.fileService.ensureDir(iconsetDir);

    try {
      // Generate PNG files for ICNS sizes
      const iconsetFiles = [];
      for (const size of sizes) {
        const pngPath = path.join(iconsetDir, `icon_${size}x${size}.png`);
        const pngPath2x = path.join(iconsetDir, `icon_${size}x${size}@2x.png`);

        // Generate 1x size
        await sharpModule.default(inputSvg)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(pngPath);

        iconsetFiles.push(pngPath);

        // Generate 2x size (if within reasonable limits)
        const doubleSize = Math.min(size * 2, 1024);
        if (sizes.includes(doubleSize)) {
          await sharpModule.default(inputSvg)
            .resize(doubleSize, doubleSize, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(pngPath2x);

          iconsetFiles.push(pngPath2x);
        }
      }

      // Try to use iconutil (macOS)
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        const icnsPath = path.join(outputDir, 'icon.icns');
        await execAsync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, {
          cwd: process.cwd()
        });

        // Clean up temp files
        await this.fileService.safeRemove(path.join(outputDir, '.temp'));

        return icnsPath;
      } catch (iconutilError) {
        // iconutil not available, but PNGs are generated
        console.warn('iconutil not available. ICNS generation requires macOS with Xcode.');
        console.warn(`PNG files are available in: ${iconsetDir}`);
        console.warn('Use iconutil on macOS or online converters to create the ICNS file.');

        // Don't clean up temp files so user can use them
        return path.join(outputDir, 'icon.iconset');
      }
    } catch (error) {
      await this.fileService.safeRemove(path.join(outputDir, '.temp'));
      throw new Error(`Failed to generate ICNS: ${error}`);
    }
  }

  /**
   * Generate favicon package
   */
  async generateFaviconPackage(
    inputSvg: string,
    outputDir: string,
    sizes: number[] = [16, 32, 48, 64, 128]
  ): Promise<string[]> {
    const faviconDir = path.join(outputDir, 'favicon');
    await this.fileService.ensureDir(faviconDir);

    const generatedFiles: string[] = [];

    // Generate favicon PNGs
    const sharpForFavicon = await import('sharp');
    await Promise.all(
      sizes.map(size =>
        sharpForFavicon.default(inputSvg)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(path.join(faviconDir, `favicon-${size}x${size}.png`))
          .then(() => {
            generatedFiles.push(path.join(faviconDir, `favicon-${size}x${size}.png`));
          })
      )
    );

    // Generate favicon.ico if possible
    const [sharpModule, pngToIcoModule] = await Promise.all([
      import('sharp').catch(() => null),
      import('png-to-ico').catch(() => null)
    ]);

    if (sharpModule && pngToIcoModule) {
      const tempDir = path.join(outputDir, '.temp-favicon');
      await this.fileService.ensureDir(tempDir);

      try {
        const tempPngPaths = await Promise.all(
          [16, 32, 48].map(size => this.generateTempPng(inputSvg, tempDir, size, sharpModule))
        );

        const icoBuffer = await pngToIcoModule.default(tempPngPaths);
        const icoPath = path.join(faviconDir, 'favicon.ico');
        const { writeFile } = await import('fs/promises');
        await fs.writeFile(icoPath, icoBuffer);
        generatedFiles.push(icoPath);

        // Clean up
        await Promise.all(tempPngPaths.map(p => this.fileService.safeRemove(p)));
        await this.fileService.safeRemove(tempDir);
      } catch (error) {
        // Ignore favicon.ico generation errors
      }
    }

    // Generate manifest.json
    const manifest = {
      "name": "favicon",
      "icons": sizes.map(size => ({
        "src": `favicon-${size}x${size}.png`,
        "sizes": `${size}x${size}`,
        "type": "image/png"
      })),
      "src": "favicon.ico",
      "sizes": "16x16 32x32 48x48"
    };

    await this.fileService.writeFile(path.join(faviconDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    generatedFiles.push(path.join(faviconDir, 'manifest.json'));

    return generatedFiles;
  }

  /**
   * Generate temporary PNG file for conversion
   */
  private async generateTempPng(
    inputSvg: string,
    tempDir: string,
    size: number,
    sharpModule: any = null
  ): Promise<string> {
    const tempPath = path.join(tempDir, `temp-${size}.png`);

    if (!sharpModule) {
      sharpModule = await import('sharp');
    }

    await sharpModule.default(inputSvg)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(tempPath);

    return tempPath;
  }

  /**
   * Get standard icon sizes for different platforms
   */
  static getStandardSizes(): {
    linux: IconSizes;
    ico: number[];
    icns: number[];
    favicon: number[];
  } {
    return {
      linux: {
        '16x16': 16,
        '32x32': 32,
        '48x48': 48,
        '64x64': 64,
        '128x128': 128,
        '256x256': 256,
        '512x512': 512,
        '1024x1024': 1024,
      },
      ico: [16, 32, 48, 256],
      icns: [16, 32, 64, 128, 256, 512, 1024],
      favicon: [16, 32, 48, 64, 128]
    };
  }
}