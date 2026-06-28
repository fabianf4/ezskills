import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import { buildDependencies } from './config/dependencies.js';

async function main(): Promise<void> {
  const deps = await buildDependencies();
  const instance = render(React.createElement(App, { deps }));
  process.on('SIGINT', () => instance.unmount());
  process.on('SIGTERM', () => instance.unmount());
}

main().catch((err: unknown) => {
  console.error((err as Error).message);
  process.exit(1);
});
