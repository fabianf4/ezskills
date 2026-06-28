import type { Detector } from '../../types/index.js';
import { StubDetector } from './stub-detector.js';

export type DetectorId = 'stub';

export class DetectorFactory {
  create(id: DetectorId): Detector {
    switch (id) {
      case 'stub':
        return new StubDetector();
      default:
        throw new Error(`DetectorFactory: unknown detector "${id}"`);
    }
  }
}
