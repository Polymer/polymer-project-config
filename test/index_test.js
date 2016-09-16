/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';
const assert = require('chai').assert;
const path = require('path');
const ProjectConfig = require('..').ProjectConfig;

suite('Project Config', () => {

  suite('ProjectConfig', () => {

    test('sets minimum set of defaults when no options are provided', () => {
      const absoluteRoot = process.cwd();
      const config = new ProjectConfig();
      assert.deepEqual(config, {
        root: absoluteRoot,
        entrypoint: path.resolve(absoluteRoot, 'index.html'),
        allFragments: [path.resolve(absoluteRoot, 'index.html')],
        dependencies: [],
        sources: [
          path.resolve(absoluteRoot, 'src/**/*'),
          path.resolve(absoluteRoot, 'index.html'),
        ],
      });
    });

    test('sets root relative to current working directory when provided', () => {
      const relativeRoot = 'public';
      const absoluteRoot = path.resolve(relativeRoot);
      const config = new ProjectConfig({root: relativeRoot});
      assert.deepEqual(config, {
        root: absoluteRoot,
        entrypoint: path.resolve(absoluteRoot, 'index.html'),
        allFragments: [path.resolve(absoluteRoot, 'index.html')],
        dependencies: [],
        sources: [
          path.resolve(absoluteRoot, 'src/**/*'),
          path.resolve(absoluteRoot, 'index.html'),
        ],
      });
    });

    test('sets entrypoint relative to root when provided', () => {
      const relativeRoot = 'public';
      const absoluteRoot = path.resolve(relativeRoot);
      const config = new ProjectConfig({
        root: relativeRoot,
        entrypoint: 'foo.html'
      });
      assert.deepEqual(config, {
        root: absoluteRoot,
        entrypoint: path.resolve(absoluteRoot, 'foo.html'),
        allFragments: [path.resolve(absoluteRoot, 'foo.html')],
        dependencies: [],
        sources: [
          path.resolve(absoluteRoot, 'src/**/*'),
          path.resolve(absoluteRoot, 'foo.html'),
        ],
      });
    });

    test('sets shell relative to root when provided', () => {
      const config = new ProjectConfig({
        shell: 'foo.html'
      });
      assert.deepEqual(config, {
        root: process.cwd(),
        entrypoint: path.resolve('index.html'),
        shell: path.resolve('foo.html'),
        allFragments: [
          path.resolve('foo.html')
        ],
        dependencies: [],
        sources: [
          path.resolve('src/**/*'),
          path.resolve('index.html'),
          path.resolve('foo.html')
        ],
      });
    });

    test('sets fragments relative to root when provided', () => {
      const config = new ProjectConfig({
        fragments: ['foo.html', 'bar.html']
      });
      assert.deepEqual(config, {
        root: process.cwd(),
        entrypoint: path.resolve('index.html'),
        fragments: [
          path.resolve('foo.html'),
          path.resolve('bar.html'),
        ],
        allFragments: [
          path.resolve('foo.html'),
          path.resolve('bar.html'),
        ],
        dependencies: [],
        sources: [
          path.resolve('src/**/*'),
          path.resolve('index.html'),
          path.resolve('foo.html'),
          path.resolve('bar.html'),
        ],
      });
    });

    test('adds sources relative to root when provided', () => {
      const relativeRoot = 'public';
      const absoluteRoot = path.resolve(relativeRoot);
      const config = new ProjectConfig({
        root: relativeRoot,
        sources: ['src/**/*', 'images/**/*']
      });
      assert.deepEqual(config, {
        root: absoluteRoot,
        entrypoint: path.resolve(absoluteRoot, 'index.html'),
        allFragments: [path.resolve(absoluteRoot, 'index.html')],
        dependencies: [],
        sources: [
          path.resolve(absoluteRoot, 'src/**/*'),
          path.resolve(absoluteRoot, 'images/**/*'),
          path.resolve(absoluteRoot, 'index.html'),
        ],
      });
    });

    test('sets dependencies relative to root when provided', () => {
      const relativeRoot = 'public';
      const absoluteRoot = path.resolve(relativeRoot);
      const config = new ProjectConfig({
        root: relativeRoot,
        dependencies: [
          'bower_components/**/*.js',
          '!bower_components/ignore-big-package',
        ],
      });
      assert.deepEqual(config, {
        root: absoluteRoot,
        entrypoint: path.resolve(absoluteRoot, 'index.html'),
        allFragments: [path.resolve(absoluteRoot, 'index.html')],
        dependencies: [
          path.resolve(absoluteRoot, 'bower_components/**/*.js'),
          '!' + path.resolve(absoluteRoot, 'bower_components/ignore-big-package'),
        ],
        sources: [
          path.resolve(absoluteRoot, 'src/**/*'),
          path.resolve(absoluteRoot, 'index.html'),
        ],
      });
    });

    test('sets allFragments to fragments & shell when both are provided', () => {
      const config = new ProjectConfig({
        fragments: ['foo.html', 'bar.html'],
        shell: 'baz.html',
      });
      assert.deepEqual(config, {
        root: process.cwd(),
        entrypoint: path.resolve('index.html'),
        shell: path.resolve('baz.html'),
        fragments: [
          path.resolve('foo.html'),
          path.resolve('bar.html'),
        ],
        allFragments: [
          path.resolve('baz.html'),
          path.resolve('foo.html'),
          path.resolve('bar.html'),
        ],
        dependencies: [],
        sources: [
          path.resolve('src/**/*'),
          path.resolve('index.html'),
          path.resolve('baz.html'),
          path.resolve('foo.html'),
          path.resolve('bar.html'),
        ],
      });
    });

  });

  suite('loadOptionsFromFile()', () => {

    test('throws an exception for invalid polymer.json', () => {
      const filepath = path.join(__dirname, 'polymer-invalid.json');
      assert.throws(() => ProjectConfig.loadOptionsFromFile(filepath));
    });

    test('returns null if file is missing', () => {
      const filepath = path.join(__dirname, 'this-file-does-not-exist.json');
      assert.equal(ProjectConfig.loadOptionsFromFile(filepath), null);
    });

    test('reads options from config file', () => {
      const options = ProjectConfig.loadOptionsFromFile(path.join(__dirname, 'polymer.json'));
      assert.deepEqual(options, {
        root: 'public',
        entrypoint: 'foo.html',
        fragments: ['bar.html'],
        dependencies: ['baz.html'],
        sources: ['src/**/*', 'images/**/*'],
      });
    });

  });

  suite('loadConfigFromFile()', () => {

    test('throws an exception for invalid polymer.json', () => {
      const filepath = path.join(__dirname, 'polymer-invalid.json');
      assert.throws(() => ProjectConfig.loadConfigFromFile(filepath));
    });

    test('returns null if file is missing', () => {
      const filepath = path.join(__dirname, 'this-file-does-not-exist.json');
      assert.equal(ProjectConfig.loadConfigFromFile(filepath), null);
    });

    test('creates config instance from config file options', () => {
      const config = ProjectConfig.loadConfigFromFile(path.join(__dirname, 'polymer.json'));
      const relativeRoot = 'public';
      const absoluteRoot = path.resolve(relativeRoot);
      assert.deepEqual(config, {
        root: absoluteRoot,
        entrypoint: path.resolve(absoluteRoot, 'foo.html'),
        fragments: [path.resolve(absoluteRoot, 'bar.html')],
        allFragments: [path.resolve(absoluteRoot, 'bar.html')],
        dependencies: [path.resolve(absoluteRoot, 'baz.html')],
        sources: [
          path.resolve(absoluteRoot, 'src/**/*'),
          path.resolve(absoluteRoot, 'images/**/*'),
          path.resolve(absoluteRoot, 'foo.html'),
          path.resolve(absoluteRoot, 'bar.html'),
        ]
      });
    });

  });

});
