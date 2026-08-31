import { readFileSync } from 'node:fs';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';
import * as vueRuntime from 'vue';
import themeConfig from '../rbph-theme.config';
import type { ThemeConfig } from './theme-config';
import { RBT_SYNC_MESSAGE_TYPES } from './sync';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { name?: string; version?: string };
const HOST_VUE_ID = '\0rbph-host-vue';
const VIRTUAL_RENDERER_PREFIX = '\0rbph-theme-renderer:';
const VIRTUAL_LOCALE_PREFIX = '\0rbph-theme-locale:';
const PUBLIC_RENDERER_PREFIX = '/@rbph-theme/renderer/';
const PUBLIC_LOCALE_PREFIX = '/@rbph-theme/locale/';
const rendererIdPattern = /^[A-Za-z0-9_.-]+$/;
const localeModulePattern = /\.(?:[cm]?[jt]s)$/i;
const config: ThemeConfig = themeConfig;

type RendererBuild = { name: string; entry: string; styles: string[]; rendererIds: string[] };
type LocaleModuleBuild = { name: string; locale: string; entry: string };

function featureConfig() {
  return config.features ?? {};
}

function sourcePath(path: string) {
  if (!path.startsWith('./') || path.includes('..')) throw new Error(`Theme source paths must be relative: ${path}`);
  return resolve(path);
}

function readJsonSource(path: string): unknown {
  try {
    return JSON.parse(readFileSync(sourcePath(path), 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Cannot read theme JSON source ${path}`, { cause: error });
  }
}

function localeSourceKind(source: string) {
  if (source.toLowerCase().endsWith('.json')) return 'json';
  if (localeModulePattern.test(source)) return 'module';
  throw new Error(`Theme locale sources must be JSON or JavaScript/TypeScript modules: ${source}`);
}

function validInlineLocale(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(validInlineLocale);
  return Boolean(value) && typeof value === 'object' && Object.entries(value as Record<string, unknown>).every(([key, item]) => Boolean(key) && validInlineLocale(item));
}

function validIconCollection(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const collection = value as Record<string, unknown>;
  return typeof collection.prefix === 'string' && Boolean(collection.prefix) && Boolean(collection.icons) && typeof collection.icons === 'object' && !Array.isArray(collection.icons);
}

function validUi(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const icons = (value as Record<string, unknown>).icons;
  return Boolean(icons) && typeof icons === 'object' && !Array.isArray(icons) && Object.entries(icons as Record<string, unknown>).every(([position, icon]) => Boolean(position) && typeof icon === 'string' && Boolean(icon));
}

function validateConfig(config: ThemeConfig) {
  const syncPermissions = config.permissions?.sync;
  if (
    syncPermissions !== undefined
    && syncPermissions !== 'all'
    && (!Array.isArray(syncPermissions) || syncPermissions.some(type => !RBT_SYNC_MESSAGE_TYPES.includes(type)))
  ) {
    throw new Error('Theme sync permissions must be "all" or an array of RbtSyncMessageType values');
  }
  for (const [id, renderer] of Object.entries(config.features?.renderers ?? {})) {
    if (!id || id.length > 120 || !rendererIdPattern.test(id)) throw new Error(`Invalid theme renderer ID: ${id}`);
    if (!['round-page', 'puzzle-page'].includes(renderer.surface)) throw new Error(`Invalid surface for renderer ${id}`);
    if (renderer.layout && !['game', 'game-full'].includes(renderer.layout)) throw new Error(`Invalid layout for renderer ${id}`);
    for (const path of [renderer.entry, ...(renderer.styles ?? [])]) {
      sourcePath(path);
    }
  }
  for (const locale of Object.keys(config.features?.locale ?? {})) {
    if (!locale || locale.length > 32 || !rendererIdPattern.test(locale)) throw new Error(`Invalid theme locale: ${locale}`);
  }
  for (const [locale, source] of Object.entries(config.features?.locale ?? {})) {
    if (typeof source === 'string') {
      sourcePath(source);
      if (localeSourceKind(source) === 'json') {
        const messages = readJsonSource(source);
        if (!messages || typeof messages !== 'object' || Array.isArray(messages)) throw new Error(`Theme locale ${locale} must contain a message object`);
      }
    } else if (!source || Array.isArray(source) || !validInlineLocale(source)) {
      throw new Error(`Inline theme locale ${locale} must contain JSON-serializable messages`);
    }
  }
  for (const collection of config.features?.icons ?? []) {
    const value = typeof collection === 'string' ? readJsonSource(collection) : collection;
    if (!validIconCollection(value)) {
      throw new Error('Every theme icon collection requires a prefix and icons object');
    }
  }
  const ui = config.features?.ui;
  if (ui && !validUi(typeof ui === 'string' ? readJsonSource(ui) : ui)) {
    throw new Error('Theme UI configuration requires a non-empty icons object');
  }
}

validateConfig(config);

function rendererBuilds(): RendererBuild[] {
  const result = new Map<string, RendererBuild>();
  for (const [id, renderer] of Object.entries(featureConfig().renderers ?? {})) {
    const entry = resolve(renderer.entry);
    const styles = [...(renderer.styles ?? [])].map(path => resolve(path));
    const existing = result.get(entry);
    if (existing) {
      if (JSON.stringify(existing.styles) !== JSON.stringify(styles)) {
        throw new Error(`Renderers sharing entry ${renderer.entry} must use the same styles`);
      }
      existing.rendererIds.push(id);
    } else result.set(entry, { name: id, entry, styles, rendererIds: [id] });
  }
  return [...result.values()];
}

const builds = rendererBuilds();
const buildsByName = new Map(builds.map(build => [build.name, build]));
const buildNameByRenderer = new Map(builds.flatMap(build => build.rendererIds.map(id => [id, build.name])));

function localeModuleBuilds(): LocaleModuleBuild[] {
  const names = new Set(builds.map(build => build.name));
  return Object.entries(featureConfig().locale ?? {}).flatMap(([locale, source], index) => {
    if (typeof source !== 'string' || localeSourceKind(source) !== 'module') return [];
    let name = `__rbph_locale_${index}`;
    while (names.has(name)) name = `_${name}`;
    names.add(name);
    return [{ name, locale, entry: resolve(source) }];
  });
}

const localeBuilds = localeModuleBuilds();
const localeBuildByName = new Map(localeBuilds.map(build => [build.name, build]));
const localeBuildByLocale = new Map(localeBuilds.map(build => [build.locale, build]));

function localeManifest(development: boolean) {
  return Object.fromEntries(
    Object.entries(featureConfig().locale ?? {}).map(([locale, source]) => {
      if (typeof source !== 'string') return [locale, { type: 'inline', messages: source }];
      if (localeSourceKind(source) === 'json') return [locale, { type: 'json', source: `./features/locales/${locale}.json` }];
      return [
        locale,
        {
          type: 'module',
          source: development ? `.${PUBLIC_LOCALE_PREFIX}${encodeURIComponent(locale)}.js` : `./features/locales/${locale}.js`,
        },
      ];
    }),
  );
}

function iconOutputPath(index: number) {
  return `./features/icons/collection-${index}.json`;
}

const uiOutputPath = './features/ui.json';

function manifestFeatures(development: boolean) {
  const features: Record<string, unknown> = {};
  const renderers = Object.fromEntries(
    Object.entries(featureConfig().renderers ?? {}).map(([id, renderer]) => [
      id,
      {
        surface: renderer.surface,
        layout: renderer.layout,
        entry: development ? `.${PUBLIC_RENDERER_PREFIX}${encodeURIComponent(buildNameByRenderer.get(id) ?? id)}.js` : `./assets/renderers/${buildNameByRenderer.get(id) ?? id}.js`,
        ...(!development && renderer.styles?.length ? { styles: ['./assets/style.css'] } : {}),
      },
    ]),
  );
  if (Object.keys(renderers).length) features.renderers = renderers;
  const locales = localeManifest(development);
  if (Object.keys(locales).length) features.locale = { locales };
  const icons = featureConfig().icons ?? [];
  if (icons.length)
    features.icons = {
      collections: icons.map((collection, index) => (typeof collection === 'string' ? iconOutputPath(index) : collection)),
    };
  const ui = featureConfig().ui;
  if (ui) features.ui = typeof ui === 'string' ? { source: uiOutputPath } : { icons: ui.icons };
  return features;
}

function themeManifest(development: boolean) {
  return {
    type: 'rbph-theme',
    apiVersion: 1,
    package: {
      name: pkg.name ?? 'rbph-theme',
      version: development ? `${pkg.version ?? '0.0.0'}-dev` : (pkg.version ?? '0.0.0'),
    },
    ...(config.permissions ? { permissions: config.permissions } : {}),
    features: manifestFeatures(development),
  };
}

function sendJson(response: import('node:http').ServerResponse, value: unknown) {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(value));
}

function hostVueBridge(): Plugin {
  return {
    name: 'rbph-host-vue',
    enforce: 'pre',
    resolveId(source) {
      if (source === 'vue') return HOST_VUE_ID;
    },
    load(id) {
      if (id !== HOST_VUE_ID) return;
      const names = Object.keys(vueRuntime).filter(name => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && name !== 'default');
      return ['const runtime = globalThis.__RBPH_THEME_VUE_RUNTIME_V1__;', "if (!runtime) throw new Error('RBPH host Vue runtime is unavailable');", ...names.map(name => `export const ${name} = runtime.${name};`), 'export default runtime;'].join(
        '\n',
      );
    },
  };
}

function rendererModule(build: RendererBuild, development: boolean) {
  const rendererImport = JSON.stringify(build.entry);
  if (!development) {
    return [
      ...build.styles.map(style => `import ${JSON.stringify(style)};`),
      `import * as renderer from ${rendererImport};`,
      'export function mount(element, context) {',
      "  if (typeof renderer.mount === 'function') return renderer.mount(element, context);",
      "  if (typeof renderer.default === 'function') return renderer.default(element, context);",
      "  if (renderer.default && typeof renderer.default.mount === 'function') return renderer.default.mount(element, context);",
      "  throw new Error('Theme module does not export mount()');",
      '}',
      'export function unmount() { renderer.unmount?.(); renderer.default?.unmount?.(); }',
      'export default { mount, unmount };',
    ].join('\n');
  }
  const styleImports = build.styles.map((style, index) => `import style${index} from ${JSON.stringify(`${style}?inline`)};`);
  const styleNames = build.styles.map((_style, index) => `style${index}`);
  const acceptedStyles = build.styles.map(style => JSON.stringify(`${style}?inline`));
  return [
    ...styleImports,
    `import * as renderer from ${rendererImport};`,
    `let css = [${styleNames.join(', ')}].join('\\n');`,
    'const activeStyles = new Set();',
    'function updateStyles() { for (const style of activeStyles) style.textContent = css; }',
    'export function mount(element, context) {',
    '  const root = element.getRootNode();',
    "  const style = document.createElement('style');",
    "  style.dataset.rbphThemeDevStyle = '';",
    '  style.textContent = css;',
    '  if (root instanceof ShadowRoot) root.prepend(style);',
    '  activeStyles.add(style);',
    '  let cleanup;',
    "  if (typeof renderer.mount === 'function') cleanup = renderer.mount(element, context);",
    "  else if (typeof renderer.default === 'function') cleanup = renderer.default(element, context);",
    "  else if (renderer.default && typeof renderer.default.mount === 'function') cleanup = renderer.default.mount(element, context);",
    "  else throw new Error('Theme module does not export mount()');",
    "  return () => { if (typeof cleanup === 'function') cleanup(); activeStyles.delete(style); style.remove(); };",
    '}',
    'export function unmount() { renderer.unmount?.(); renderer.default?.unmount?.(); }',
    'export default { mount, unmount };',
    ...(acceptedStyles.length ? [`if (import.meta.hot) import.meta.hot.accept([${acceptedStyles.join(', ')}], modules => {`, `  css = modules.map(module => module?.default ?? '').join('\\n');`, '  updateStyles();', '});'] : []),
  ].join('\n');
}

function localeModule(build: LocaleModuleBuild) {
  const localeImport = JSON.stringify(build.entry);
  return [
    `import messages from ${localeImport};`,
    'export default messages;',
    'if (import.meta.hot) {',
    `  import.meta.hot.accept(${localeImport}, module => {`,
    `    window.dispatchEvent(new CustomEvent('rbph-theme-locale-update-v1', { detail: { locale: ${JSON.stringify(build.locale)}, messages: module?.default } }));`,
    '  });',
    '}',
  ].join('\n');
}

function themeRenderers(): Plugin {
  let development = false;
  return {
    name: 'rbph-theme-renderers',
    enforce: 'pre',
    configResolved(config) {
      development = config.command === 'serve';
    },
    resolveId(source) {
      if (source.startsWith(PUBLIC_RENDERER_PREFIX)) {
        const name = decodeURIComponent(source.slice(PUBLIC_RENDERER_PREFIX.length).replace(/\.js$/, ''));
        if (buildsByName.has(name)) return `${VIRTUAL_RENDERER_PREFIX}${name}`;
      }
      if (source.startsWith(PUBLIC_LOCALE_PREFIX)) {
        const locale = decodeURIComponent(source.slice(PUBLIC_LOCALE_PREFIX.length).replace(/\.js$/, ''));
        if (localeBuildByLocale.has(locale)) return `${VIRTUAL_LOCALE_PREFIX}${locale}`;
      }
      if (source.startsWith(VIRTUAL_RENDERER_PREFIX)) return source;
      if (source.startsWith(VIRTUAL_LOCALE_PREFIX)) return source;
    },
    transform(code, id) {
      if (development) return;
      const build = builds.find(item => item.entry === id);
      if (build?.styles.length) return `${build.styles.map(style => `import ${JSON.stringify(style)};`).join('\n')}\n${code}`;
    },
    load(id) {
      if (id.startsWith(VIRTUAL_RENDERER_PREFIX)) {
        const build = buildsByName.get(id.slice(VIRTUAL_RENDERER_PREFIX.length));
        if (build) return rendererModule(build, development);
      }
      if (id.startsWith(VIRTUAL_LOCALE_PREFIX)) {
        const build = localeBuildByLocale.get(id.slice(VIRTUAL_LOCALE_PREFIX.length));
        if (build) return localeModule(build);
      }
    },
  };
}

function themeDevManifest(): Plugin {
  return {
    name: 'rbph-theme-dev-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/rbph-theme.json', (_request, response) => sendJson(response, themeManifest(true)));
      for (const [locale, source] of Object.entries(featureConfig().locale ?? {})) {
        if (typeof source === 'string' && localeSourceKind(source) === 'json') {
          server.middlewares.use(`/features/locales/${locale}.json`, (_request, response) => sendJson(response, readJsonSource(source)));
        }
      }
      for (const [index, collection] of (featureConfig().icons ?? []).entries()) {
        if (typeof collection === 'string') {
          server.middlewares.use(iconOutputPath(index).slice(1), (_request, response) => sendJson(response, readJsonSource(collection)));
        }
      }
      const ui = featureConfig().ui;
      if (typeof ui === 'string') {
        server.middlewares.use(uiOutputPath.slice(1), (_request, response) => sendJson(response, readJsonSource(ui)));
      }
    },
  };
}

function themeProductionManifest(): Plugin {
  return {
    name: 'rbph-theme-production-manifest',
    apply: 'build',
    async writeBundle() {
      const locales = featureConfig().locale ?? {};
      const jsonLocales = Object.entries(locales).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && localeSourceKind(entry[1]) === 'json');
      if (jsonLocales.length) await mkdir(resolve('dist/features/locales'), { recursive: true });
      await Promise.all(jsonLocales.map(([locale, source]) => copyFile(sourcePath(source), resolve(`dist/features/locales/${locale}.json`))));
      const externalIcons = (featureConfig().icons ?? []).map((collection, index) => (typeof collection === 'string' ? { source: collection, index } : undefined)).filter((item): item is { source: string; index: number } => Boolean(item));
      if (externalIcons.length) await mkdir(resolve('dist/features/icons'), { recursive: true });
      await Promise.all(externalIcons.map(({ source, index }) => copyFile(sourcePath(source), resolve(`dist/${iconOutputPath(index).slice(2)}`))));
      const ui = featureConfig().ui;
      if (typeof ui === 'string') {
        await mkdir(resolve('dist/features'), { recursive: true });
        await copyFile(sourcePath(ui), resolve(`dist/${uiOutputPath.slice(2)}`));
      }
      await writeFile(resolve('dist/rbph-theme.json'), `${JSON.stringify(themeManifest(false), null, 2)}\n`);
    },
  };
}

const buildEntries = builds.length || localeBuilds.length ? Object.fromEntries([...builds, ...localeBuilds].map(build => [build.name, build.entry])) : { empty: resolve('.rbph/empty-entry.ts') };

export default defineConfig({
  plugins: [tailwindcss(), hostVueBridge(), themeRenderers(), vue(), themeDevManifest(), themeProductionManifest()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: {
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: buildEntries,
      formats: ['es'],
      fileName: (_format, entryName) => {
        const locale = localeBuildByName.get(entryName)?.locale;
        return locale ? `features/locales/${locale}.js` : `assets/renderers/${entryName}.js`;
      },
    },
    rollupOptions: {
      output: {
        assetFileNames: info => (info.name?.endsWith('.css') ? 'assets/style.css' : 'assets/[name][extname]'),
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
      },
    },
  },
});
