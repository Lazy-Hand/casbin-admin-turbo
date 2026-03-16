import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  loadYamlConfig,
  resolveConfigPaths,
  type AppConfig,
} from './yaml-config.loader';

function writeYamlFile(dir: string, fileName: string, content: string): void {
  writeFileSync(join(dir, fileName), content, 'utf8');
}

const defaultYaml = `
port: 8080
nodeEnv: development
globalPrefix: /api
upload:
  dir: uploads
  chunkDir: uploads/chunks
  prefix: /uploads
  maxFileSize: 10485760
  maxFiles: 10
  chunkSize: 5242880
redis:
  host: localhost
  port: 6379
  db: 0
  keyPrefix: "app:"
  enablePubSub: false
jwt:
  secret: local-secret
  expiresIn: 604800
  sessionTtl: 7200
  sessionRefreshThreshold: 1800
casl:
  cache:
    ttl: 1800000
    max: 1000
  logging:
    level: info
    logPermissions: false
  performance:
    enablePreload: true
    enableBatchLoad: true
    slowQueryThreshold: 100
logging:
  level: info
  enableConsole: true
  enableFile: true
  logDir: logs
  maxFileSize: 20m
  maxFiles: 14d
  datePattern: YYYY-MM-DD
  enablePrismaLogging: true
  prismaLogLevels:
    - query
    - info
    - warn
    - error
`;

describe('yaml-config.loader', () => {
  it('merges default.yaml with environment override yaml', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'server-config-'));
    try {
      writeYamlFile(tempDir, 'default.yaml', defaultYaml);
      writeYamlFile(
        tempDir,
        'production.yaml',
        `
port: 9000
redis:
  host: redis-prod
logging:
  level: warn
`,
      );

      const config = loadYamlConfig({
        nodeEnv: 'production',
        configDir: tempDir,
      });

      expect(config.port).toBe(9000);
      expect(config.redis.host).toBe('redis-prod');
      expect(config.redis.port).toBe(6379);
      expect(config.logging.level).toBe('warn');
      expect(config.upload.maxFiles).toBe(10);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('throws on invalid config shape', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'server-config-invalid-'));
    try {
      writeYamlFile(
        tempDir,
        'default.yaml',
        `
port: invalid-port
`,
      );

      expect(() =>
        loadYamlConfig({
          nodeEnv: 'development',
          configDir: tempDir,
        }),
      ).toThrow('Server config validation failed');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('resolves config file paths using NODE_ENV naming', () => {
    const paths = resolveConfigPaths({
      configDir: '/tmp/config',
      nodeEnv: 'staging',
    });

    expect(paths.defaultPath).toBe('/tmp/config/default.yaml');
    expect(paths.overridePath).toBe('/tmp/config/staging.yaml');
  });

  it('returns typed AppConfig object', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'server-config-type-'));
    try {
      writeYamlFile(tempDir, 'default.yaml', defaultYaml);

      const config: AppConfig = loadYamlConfig({
        nodeEnv: 'development',
        configDir: tempDir,
      });
      expect(config.jwt.secret).toBe('local-secret');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
