import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppConfigSchema, type AppConfig } from './app-config.schema';

const yaml = require('js-yaml');

type JsonLike = Record<string, unknown>;

interface ResolvePathsOptions {
  configDir: string;
  nodeEnv: string;
}

interface LoadYamlConfigOptions {
  configDir?: string;
  nodeEnv?: string;
}

function isPlainObject(value: unknown): value is JsonLike {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base: JsonLike, override: JsonLike): JsonLike {
  const merged: JsonLike = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = merged[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      merged[key] = deepMerge(baseValue, overrideValue);
      continue;
    }
    merged[key] = overrideValue;
  }

  return merged;
}

function parseYamlFile(path: string): JsonLike {
  if (!existsSync(path)) {
    return {};
  }

  const content = readFileSync(path, 'utf8');
  if (!content.trim()) {
    return {};
  }

  const parsed = yaml.load(content);
  if (!parsed) {
    return {};
  }
  if (!isPlainObject(parsed)) {
    throw new Error(`Config file must contain an object: ${path}`);
  }
  return parsed;
}

export function resolveConfigPaths({
  configDir,
  nodeEnv,
}: ResolvePathsOptions): { defaultPath: string; overridePath: string } {
  return {
    defaultPath: join(configDir, 'default.yaml'),
    overridePath: join(configDir, `${nodeEnv}.yaml`),
  };
}

export function loadYamlConfig(options: LoadYamlConfigOptions = {}): AppConfig {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV ?? 'development';
  const configDir = options.configDir ?? join(process.cwd(), 'config');
  const { defaultPath, overridePath } = resolveConfigPaths({
    configDir,
    nodeEnv,
  });

  if (!existsSync(defaultPath)) {
    throw new Error(`Missing required config file: ${defaultPath}`);
  }

  const defaultConfig = parseYamlFile(defaultPath);
  const overrideConfig = parseYamlFile(overridePath);
  const merged = deepMerge(defaultConfig, overrideConfig);

  if (!Object.prototype.hasOwnProperty.call(merged, 'nodeEnv')) {
    merged.nodeEnv = nodeEnv;
  }

  const result = AppConfigSchema.safeParse(merged);
  if (!result.success) {
    throw new Error(
      `Server config validation failed:\n${result.error.issues
        .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
        .join('\n')}`,
    );
  }

  return result.data;
}

export type { AppConfig };
