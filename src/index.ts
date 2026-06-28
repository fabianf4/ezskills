#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { buildDependencies } from './config/dependencies.js';
import { parseArgs } from './cli/args.js';
import { printHelp, printVersion } from './cli/output.js';

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  switch (parsed.kind) {
    case 'version':
      printVersion();
      process.exit(0);
      return;
    case 'help':
      printHelp();
      process.exit(0);
      return;
    case 'error':
      console.error(parsed.text);
      process.exit(2);
      return;
    case 'run':
      break;
  }
  const deps = await buildDependencies();
  const instance = render(React.createElement(App, { deps }));
  process.on('SIGINT', () => instance.unmount());
  process.on('SIGTERM', () => instance.unmount());
}

main().catch((err: unknown) => {
  console.error((err as Error).message);
  process.exit(1);
});
