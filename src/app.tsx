import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { MainMenu } from './views/screens/main-menu.js';
import { InstallScreen } from './views/screens/install-screen.js';
import { UninstallScreen } from './views/screens/uninstall-screen.js';
import { ProviderPicker } from './views/screens/provider-picker.js';
import { StatusMessage } from './views/components/status-message.js';
import { MainMenuController } from './controllers/main-menu-controller.js';
import { InstallController } from './controllers/install-controller.js';
import { UninstallController } from './controllers/uninstall-controller.js';
import type { AppDependencies } from './config/dependencies.js';
import type { IndexedSkill, InstalledSkill, Scope } from './types/index.js';

type Screen = 'main' | 'pickProvider' | 'install' | 'uninstall';
type Mode = 'install' | 'uninstall';

export interface AppProps {
  deps: AppDependencies;
}

export const App: React.FC<AppProps> = ({ deps }) => {
  const [screen, setScreen] = useState<Screen>('main');
  const [mode, setMode] = useState<Mode>('install');
  const [status, setStatus] = useState<{ kind: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [exitRequested, setExitRequested] = useState(false);
  const [scope, setScope] = useState<Scope>('local');
  const [providerIds, setProviderIds] = useState<ReadonlySet<string> | null>(null);

  const [available, setAvailable] = useState<IndexedSkill[]>([]);
  const [installedNames, setInstalledNames] = useState<Set<string>>(new Set());
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);

  const mainMenuController = useMemo(() => new MainMenuController({
    onInstall: (s: Scope) => { setScope(s); setMode('install'); setScreen('pickProvider'); },
    onUninstall: (s: Scope) => { setScope(s); setMode('uninstall'); setScreen('pickProvider'); },
    onExit: () => setExitRequested(true),
  }), []);

  const installController = useMemo(() => {
    if (!providerIds) return null;
    return new InstallController(
      deps.skillRepo,
      deps.installedRepo,
      deps.installer,
      providerIds,
      {
        onBack: () => setScreen('main'),
        onResult: (r) => {
          setStatus({
            kind: r.failed.length > 0 ? 'error' : 'success',
            text: `Installed: ${r.installed.join(', ') || 'none'}; skipped: ${r.skipped.join(', ') || 'none'}; failed: ${r.failed.map((f) => f.name).join(', ') || 'none'}`,
          });
          setScreen('main');
        },
        onError: (m) => setStatus({ kind: 'error', text: m }),
      },
    );
  }, [deps.skillRepo, deps.installedRepo, deps.installer, providerIds]);

  const uninstallController = useMemo(() => {
    if (!providerIds) return null;
    return new UninstallController(
      deps.installedRepo,
      deps.installer,
      providerIds,
      {
        onBack: () => setScreen('main'),
        onResult: (r) => {
          setStatus({
            kind: r.failed.length > 0 ? 'error' : 'success',
            text: `Uninstalled: ${r.uninstalled.join(', ') || 'none'}; failed: ${r.failed.map((f) => f.name).join(', ') || 'none'}`,
          });
          setScreen('main');
        },
      },
    );
  }, [deps.installedRepo, deps.installer, providerIds]);

  useEffect(() => {
    if (screen === 'install' && installController) {
      installController.loadInstalledNames().then(setInstalledNames);
      if (available.length === 0) {
        installController.loadAvailable().then(setAvailable);
      }
    }
  }, [screen, installController, available.length]);

  useEffect(() => {
    if (screen === 'uninstall' && uninstallController) {
      uninstallController.loadInstalled(scope).then(setInstalled);
      if (available.length === 0) {
        deps.skillRepo.getAll().then(setAvailable);
      }
    }
  }, [screen, uninstallController, deps.skillRepo, available.length, scope]);

  if (exitRequested) {
    return React.createElement(Text, { dimColor: true }, 'Goodbye!');
  }

  if (screen === 'pickProvider') {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      status ? React.createElement(StatusMessage, status) : null,
      React.createElement(ProviderPicker, {
        title: mode === 'install' ? 'Choose tools to install to' : 'Choose tools to uninstall from',
        providers: deps.listInstalledProviders(),
        onConfirm: (ids) => { setProviderIds(new Set(ids)); setScreen(mode); },
        onBack: () => { setScreen('main'); setProviderIds(null); },
      }),
    );
  }

  if (screen === 'install' && installController) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      status ? React.createElement(StatusMessage, status) : null,
      React.createElement(InstallScreen, {
        available,
        installedNames,
        scope,
        onScopeChange: (s) => setScope(s),
        onConfirm: (skills) => installController.confirm(skills, scope),
        onBack: () => { installController.back(); setStatus(null); },
      }),
    );
  }

  if (screen === 'uninstall' && uninstallController) {
    return React.createElement(
      Box,
      { flexDirection: 'column' },
      status ? React.createElement(StatusMessage, status) : null,
      React.createElement(UninstallScreen, {
        installed,
        available,
        scope,
        onScopeChange: (s) => setScope(s),
        onConfirm: (skills) => uninstallController.confirm(skills),
        onBack: () => { uninstallController.back(); setStatus(null); },
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
