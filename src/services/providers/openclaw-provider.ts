import { dirname } from 'node:path';
import type { FsAdapter } from '../../types/index.js';
import { BaseFsProvider, type ProviderPaths } from './base-fs-provider.js';

export class OpenClawProvider extends BaseFsProvider {
  readonly id = 'openclaw';
  readonly label = 'OpenClaw';

  constructor(paths: ProviderPaths, fs: FsAdapter) {
    super(paths, fs, dirname(paths.global));
  }
}
