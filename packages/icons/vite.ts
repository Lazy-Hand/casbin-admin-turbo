import path from 'node:path';
import { fileURLToPath } from 'node:url';
import IconsResolver from 'unplugin-icons/resolver';
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import { APP_ICON_COLLECTION, ICON_COMPONENT_PREFIX, PACKAGE_ICON_COLLECTION } from './meta.js';

export interface CasbinIconsOptions {
  appIconDir?: string;
  appCollectionName?: string;
  packageCollectionName?: string;
  componentPrefix?: string;
  scale?: number;
  defaultClass?: string;
  autoInstall?: boolean;
}

type IconCollectionLoader = ReturnType<typeof FileSystemIconLoader>;
type IconCollections = Record<string, IconCollectionLoader>;
type IconsPlugin = ReturnType<typeof Icons>;

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageIconDir = path.resolve(packageRoot, 'icons');

function withCurrentColor(svg: string) {
  if (svg.includes('currentColor')) {
    return svg;
  }

  return svg.replace('<svg', '<svg fill="currentColor"');
}

function createFileSystemCollection(dir: string) {
  return FileSystemIconLoader(dir, withCurrentColor);
}

export function createIconCollections(options: CasbinIconsOptions = {}): IconCollections {
  const packageCollectionName = options.packageCollectionName ?? PACKAGE_ICON_COLLECTION;
  const appCollectionName = options.appCollectionName ?? APP_ICON_COLLECTION;

  const collections: IconCollections = {
    [packageCollectionName]: createFileSystemCollection(packageIconDir),
  };

  if (options.appIconDir) {
    collections[appCollectionName] = createFileSystemCollection(options.appIconDir);
  }

  return collections;
}

export function createIconsPlugin(options: CasbinIconsOptions = {}): IconsPlugin {
  return Icons({
    compiler: 'vue3',
    autoInstall: options.autoInstall ?? false,
    scale: options.scale ?? 1,
    defaultClass: options.defaultClass ?? 'ca-icon',
    customCollections: createIconCollections(options),
  });
}

export function createIconsResolver(options: CasbinIconsOptions = {}) {
  const packageCollectionName = options.packageCollectionName ?? PACKAGE_ICON_COLLECTION;
  const enabledCollections = [packageCollectionName];

  if (options.appIconDir) {
    enabledCollections.push(options.appCollectionName ?? APP_ICON_COLLECTION);
  }

  return IconsResolver({
    prefix: options.componentPrefix ?? ICON_COMPONENT_PREFIX,
    enabledCollections,
  });
}

export function resolveAppIconDir(fromDir: string) {
  return path.resolve(fromDir, 'src/assets/icons');
}
