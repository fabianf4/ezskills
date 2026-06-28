import type { FsAdapter } from '../../types/index.js';
import { BaseFsProvider, type ProviderPaths } from './base-fs-provider.js';

export class OpenCodeProvider extends BaseFsProvider {
  readonly id = 'opencode';

  constructor(paths: ProviderPaths, fs: FsAdapter) {
    super(paths, fs);
  }
}
