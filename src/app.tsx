import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './views/screens/main-menu.js';
import { InstallScreen } from './views/screens/install-screen.js';
import { UninstallScreen } from './views/screens/uninstall-screen.js';
import { AutoDetectResult } from './views/screens/auto-detect-screen.js';
import { StatusMessage } from './views/components/status-message.js';
import { MainMenuController } from './controllers/main-menu-controller.js';
import { InstallController } from './controllers/install-controller.js';
import { UninstallController } from './controllers/uninstall-controller.js';
import { AutoDetectController } from './controllers/auto-detect-controller.js';
import { MenuState } from './models/menu-state.js';
import type { AppDependencies } from './config/dependencies.js';
import type { IndexedSkill, InstalledSkill, Scope } from './types/index.js';

export interface AppProps {
  deps: AppDependencies;
}

export const App: React.FC<AppProps> = ({ deps }) => {
  const [menuState] = useState(() => new MenuState());
  const [screen, setScreen] = useState<'main' | 'install' | 'uninstall' | 'auto'>('main');
  const [status, setStatus] = useState<{ kind: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [exitRequested, setExitRequested] = useState(false);

  const [installController] = useState(() =>
    new InstallController(
      deps.skillRepo,
      deps.installedRepo,
      deps.installer,
      'opencode',
      {
        onBack: () => { setScreen('main'); menuState.reset(); },
        onResult: (r) => {
          setStatus({
            kind: r.failed.length > 0 ? 'error' : 'success',
            text: `Installed: ${r.installed.join(', ') || 'none'}; skipped: ${r.skipped.join(', ') || 'none'}; failed: ${r.failed.map((f) => f.name).join(', ') || 'none'}`,
          });
          setScreen('main');
          menuState.reset();
        },
        onError: (m) => setStatus({ kind: 'error', text: m }),
      },
    ),
  );

  const [uninstallController] = useState(() =>
    new UninstallController(deps.installedRepo, deps.installer, {
      onBack: () => { setScreen('main'); menuState.reset(); },
      onResult: (r) => {
        setStatus({
          kind: r.failed.length > 0 ? 'error' : 'success',
          text: `Uninstalled: ${r.uninstalled.join(', ') || 'none'}; failed: ${r.failed.map((f) => f.name).join(', ') || 'none'}`,
        });
        setScreen('main');
        menuState.reset();
      },
    }),
  );

  const [mainMenuController] = useState(() => new MainMenuController(menuState, {
    onInstall: (s: Scope) => { setScope(s); installController.setScope(s); setScreen('install'); },
    onUninstall: (s: Scope) => { setScope(s); uninstallController.setScope(s); setScreen('uninstall'); },
    onAuto: () => setScreen('auto'),
    onExit: () => setExitRequested(true),
  }));

  const [available, setAvailable] = useState<IndexedSkill[]>([]);
  const [installedNames, setInstalledNames] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<Scope>('local');
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [autoResult, setAutoResult] = useState<{ technologies: string[]; suggested: IndexedSkill[] } | null>(null);

  useEffect(() => {
    if (screen === 'install' && available.length === 0) {
      installController.loadAvailable().then(setAvailable);
      installController.loadInstalledNames().then(setInstalledNames);
    }
  }, [screen, available.length, installController]);

  useEffect(() => {
    if (screen === 'uninstall') {
      uninstallController.setScope(scope);
      uninstallController.loadInstalled().then(setInstalled);
    }
  }, [screen, scope, uninstallController]);

  useEffect(() => {
    if (screen === 'auto' && !autoResult && !autoLoading) {
      setAutoLoading(true);
      const c = new AutoDetectController({ detector: deps.detector, skillRepo: deps.skillRepo, cwd: process.cwd() });
      c.run().then((r) => {
        setAutoResult(r);
        setAutoLoading(false);
      });
    }
  }, [screen, autoResult, autoLoading, deps]);

  if (exitRequested) {
    return React.createElement(Text, { dimColor: true }, 'Goodbye!');
  }

  if (screen === 'install') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      status ? React.createElement(StatusMessage, status) : null,
      React.createElement(InstallScreen, {
        available,
        installedNames,
        scope,
        onScopeChange: (s) => { setScope(s); installController.setScope(s); },
        onConfirm: (skills) => installController.confirm(skills),
        onBack: () => { installController.back(); setStatus(null); },
      }),
    );
  }

  if (screen === 'uninstall') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      status ? React.createElement(StatusMessage, status) : null,
      React.createElement(UninstallScreen, {
        installed,
        scope,
        onScopeChange: (s) => setScope(s),
        onConfirm: async (skills) => {
          for (const s of skills) uninstallController.toggle(s.name);
          await uninstallController.confirm();
        },
        onBack: () => { uninstallController.back(); setStatus(null); },
      }),
    );
  }

  if (screen === 'auto') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      React.createElement(AutoDetectResult, {
        loading: autoLoading,
        technologies: autoResult?.technologies ?? [],
        suggested: autoResult?.suggested ?? [],
        onConfirm: (_skills: IndexedSkill[]) => {
          setScreen('install');
        },
        onBack: () => { setScreen('main'); menuState.reset(); setAutoResult(null); },
      }),
    );
  }

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    status ? React.createElement(StatusMessage, status) : null,
    React.createElement(MainMenu, {
      options: mainMenuController.getOptions(),
      canGoBack: mainMenuController.canGoBack(),
      onSelect: (id) => {
        setStatus(null);
        mainMenuController.handleSelect(id, scope);
      },
      onBack: () => {
        setStatus(null);
        mainMenuController.back();
      },
    }),
  );
};
