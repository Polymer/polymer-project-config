/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import * as logging from 'plylog';

const logger = logging.getLogger('polymer-project-config');

/**
 * The default globs for matching all user application source files.
 */
export const defaultSourceGlobs = ['src/**/*'];

/**
 * Resolve any glob to the given path, even if glob
 * is negative (begins with '!').
 */
function resolveGlob(fromPath: string, glob: string): string {
  if (glob.startsWith('!')) {
    const includeGlob = glob.substring(1);
    return '!' + path.resolve(fromPath, includeGlob);
  } else {
    return path.resolve(fromPath, glob);
  }
}

/**
 * Given a user-provided options object, check for deprecated options. When one
 * is found, warn the user and fix if possible.
 */
function fixDeprecatedOptions(options: any): ProjectOptions {
  if (typeof options.sourceGlobs !== 'undefined') {
    logger.warn('"sourceGlobs" config option has been renamed to "sources" and will no longer be supported in future versions');
    options.sources = options.sources || options.sourceGlobs;
  }
  if (typeof options.includeDependencies !== 'undefined') {
    logger.warn('"includeDependencies" config option has been renamed to "dependencies" and will no longer be supported in future versions');
    options.dependencies = options.dependencies || options.includeDependencies;
  }
  return options;
}


export interface ProjectOptions {
  /**
   * Path to the root of the project on the filesystem. This can be an absolute
   * path, or a path relative to the current working directory. Defaults to the
   * current working directory of the process.
   */
  root?: string;

  /**
   * The path relative to `root` of the entrypoint file that will be served for
   * app-shell style projects. Usually this is index.html.
   */
  entrypoint?: string;

  /**
   * The path relative to `root` of the app shell element.
   */
  shell?: string;

  /**
   * The path relative to `root` of the lazily loaded fragments. Usually the
   * pages of an app or other bundles of on-demand resources.
   */
  fragments?: string[];

  /**
   * List of glob patterns, relative to root, of this project's sources to read
   * from the file system.
   */
  sources?: string[];

  /**
   * List of file paths, relative to the project directory, that should be included
   * as dependencies in the build target.
   */
  dependencies?: string[];
}

export class ProjectConfig {

  readonly root: string;
  readonly entrypoint: string;
  readonly shell: string;
  readonly fragments: string[];
  readonly sources: string[];
  readonly dependencies: string[];

  readonly allFragments: string[];

  /**
   * Given an absolute file path to a polymer.json-like ProjectOptions object,
   * read that file. If no file exists, null is returned. If the file exists
   * but there is a problem reading or parsing it, throw an exception.
   */
  static loadOptionsFromFile(filepath: string): ProjectOptions {
    let configParsed: ProjectOptions;
    try {
      const configContent = fs.readFileSync(filepath, 'utf-8');
      configParsed = JSON.parse(configContent);
    } catch (error) {
      // swallow "not found" errors because they are so common / expected
      if (error.code === 'ENOENT') {
        logger.debug('no polymer config file found', {file: filepath});
        return null;
      }
      // otherwise, throw an exception
      throw error;
    }

    return configParsed;
  }

  /**
   * Given an absolute file path to a polymer.json-like ProjectOptions object,
   * return a new ProjectConfig instance created with those options.
   */
  static loadConfigFromFile(filepath: string): ProjectConfig {
    let configParsed = ProjectConfig.loadOptionsFromFile(filepath);
    if (!configParsed) {
      return null;
    }
    return new ProjectConfig(configParsed);
  }

  /**
   * constructor - given a ProjectOptions object, create the correct project
   * configuration for those options. This involves setting the correct
   * defaults, validating options, warning on deprecated options, and
   * calculating some additional properties.
   */
  constructor(options: ProjectOptions) {
    options = options || {};
    options = fixDeprecatedOptions(options);

    /**
     * root
     */
    if (options.root) {
      this.root = path.resolve(options.root);
    } else {
      this.root = process.cwd();
    }

    /**
     * entrypoint
     */
    if (options.entrypoint) {
      this.entrypoint = path.resolve(this.root, options.entrypoint);
    } else {
      this.entrypoint = path.resolve(this.root, 'index.html');
    }

    /**
     * shell
     */
    if (options.shell) {
      this.shell = path.resolve(this.root, options.shell);
    }

    /**
     * fragments
     */
    if (options.fragments) {
      this.fragments = options.fragments.map((e) => path.resolve(this.root, e));
    }

    /**
     * dependencies
     */
    this.dependencies = (options.dependencies || [])
        .map((glob) => resolveGlob(this.root, glob));

    /**
     * sources
     */
    this.sources = (options.sources || defaultSourceGlobs)
        .map((glob) => resolveGlob(this.root, glob));
    this.sources.push(this.entrypoint);
    if (this.shell) {
      this.sources.push(this.shell);
    }
    if (this.fragments) {
      this.sources = this.sources.concat(this.fragments);
    }

    /**
     * allFragments
     */
    this.allFragments = [];
    // It's important that shell is first for document-ordering of imports
    if (this.shell) {
      this.allFragments.push(this.shell);
    }
    if (this.fragments) {
      this.allFragments = this.allFragments.concat(this.fragments);
    }
    if (this.allFragments.length === 0) {
      this.allFragments.push(this.entrypoint);
    }
  }

}
