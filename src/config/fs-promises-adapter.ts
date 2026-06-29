import { existsSync } from 'node:fs';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import type { FsAdapter } from '../types/index.js';

export function createFsPromisesAdapter(): FsAdapter {
  return {
    readdir: readdir as FsAdapter['readdir'],
    readFile: readFile as FsAdapter['readFile'],
    stat: stat as FsAdapter['stat'],
    mkdir: mkdir as FsAdapter['mkdir'],
    writeFile: writeFile as FsAdapter['writeFile'],
    cp: cp as FsAdapter['cp'],
    rm: rm as FsAdapter['rm'],
    existsSync,
  };
}
