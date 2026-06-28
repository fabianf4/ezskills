import type { FsAdapter } from '../../types/index.js';
import { BaseFsProvider, type ProviderPaths } from './base-fs-provider.js';

export class OpenClawProvider extends BaseFsProvider {
  readonly id = 'openclaw';

  constructor(paths: ProviderPaths, fs: FsAdapter) {
    super(paths, fs);
  }
}
