import type { Dirent, PathLike, Stats } from 'node:fs';

export interface FsAdapter {
  readdir(
    path: PathLike,
    options: { withFileTypes: true },
  ): Promise<Dirent[]>;
  readFile(path: PathLike, encoding: 'utf-8'): Promise<string>;
  stat(path: PathLike): Promise<Stats>;
  mkdir(path: PathLike, options: { recursive: boolean }): Promise<string | undefined>;
  writeFile(path: PathLike, content: string): Promise<void>;
  cp(
    source: PathLike,
    destination: PathLike,
    options: { recursive: boolean },
  ): Promise<void>;
  rm(path: PathLike, options: { recursive: boolean; force: boolean }): Promise<void>;
  existsSync(path: PathLike): boolean;
}
