import * as fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import * as chokidar from "chokidar";

export type CompiledSvgTemplate =
  | ReturnType<typeof Handlebars.compile>
  | undefined;

interface TemplateInfo {
  compiledTemplate: CompiledSvgTemplate;
  lastModified: Date;
}

/**
 * Singleton class that manages compiled SVG templates. This
 * avoids having every action maintain its own compiled SVG templates
 * and unnecessarily compiling templates repeatedly when they
 * are shared across actions.
 */
class SvgTemplateManager {
  private static instance: SvgTemplateManager | null = null;
  private templates: Map<string, TemplateInfo>;
  private watcher: chokidar.FSWatcher;

  private constructor() {
    this.templates = new Map<string, TemplateInfo>();
    this.watcher = chokidar.watch([]);
    this.watcher.on("change", (filePath) => {
      // Chokidar provides the filePath in the platform-specific format, so on
      // windows the slashes are the wrong way around for what the code expects.
      // Normalize everything here so the cache will hit properly.
      this.cacheTemplate(path.normalize(filePath).replace(/\\/g, "/"));
    });
  }

  /**
   * Retrieves an instance of the SVG manager.
   * @returns The SVG manager instance
   */
  public static getInstance(): SvgTemplateManager {
    if (!SvgTemplateManager.instance) {
      SvgTemplateManager.instance = new SvgTemplateManager();
    }

    return SvgTemplateManager.instance;
  }

  /**
   * Checks to see if a filePath ends in ".svg".
   * @param filePath The path to the file to test
   * @returns True if the filename ends in ".svg"
   */
  private static isSvg(filePath: string | undefined) {
    return (
      filePath !== undefined && path.extname(filePath).toLowerCase() === ".svg"
    );
  }

  /**
   * Adds an SVG template to the manager. If the doesn't exist
   * or isn't an SVG then nothing is added. If the file hasn't changed
   * since it was last added then nothing is generated.
   * @param filePath
   */
  private cacheTemplate(filePath: string): CompiledSvgTemplate {
    if (!SvgTemplateManager.isSvg(filePath)) {
      return undefined;
    }

    try {
      const stats = fs.statSync(filePath);
      const lastModified = stats.mtime;
      const templateContent = fs.readFileSync(filePath, "utf8");
      const compiledTemplate = Handlebars.compile(templateContent);

      this.templates.set(filePath, {
        compiledTemplate,
        lastModified,
      });

      this.watcher.add(filePath);

      return compiledTemplate;
    } catch (err: unknown) {
      console.error(err);
    }

    return undefined;
  }

  /**
   * Gets the compiled template for a given file path. If the template
   * wasn't already cached, generates the compiled version and caches it.
   * @param filePath The file path to retrieve the template for.
   * @returns The compiled template or undefined if none is available.
   */
  private getTemplate(filePath: string | undefined): CompiledSvgTemplate {
    if (!filePath) {
      return undefined;
    }

    const templateInfo = this.templates.get(filePath);

    // If the template wasn't cached then cache it and return the newly cached template.
    return templateInfo?.compiledTemplate ?? this.cacheTemplate(filePath);
  }

  /**
   * Takes a path to an image and renders the SVG with the appropriate placeholders
   * populated. Returns the resulting SVG, or undefined if the template doesn't exist.
   * @param template The compiled template generated by compileSvg()
   * @param replacements The replacments to apply
   * @returns The SVG with the replacements applied or undefined
   */
  public renderSvg(filePath: string, view: object): string | undefined {
    const template = this.getTemplate(filePath);

    if (!template) {
      return undefined;
    }

    const renderedSvg = template(view);

    return `data:image/svg+xml;base64,${Buffer.from(
      renderedSvg,
      "utf8"
    ).toString("base64")}`;
  }

  /**
   * Removes all tracked templates.
   */
  public reset() {
    this.templates = new Map<string, TemplateInfo>();
  }
}

const svgTempateManagerInstance = SvgTemplateManager.getInstance();

export default svgTempateManagerInstance;
