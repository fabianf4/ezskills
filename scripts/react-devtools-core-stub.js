// Stub for react-devtools-core used by ink's devtools.js (process.env.DEV === 'true').
// ezskills does not use React DevTools; this stub satisfies the import so the bundle
// is self-contained. Calling connectToDevTools() is a no-op.
export default {
  connectToDevTools: () => {},
  initialize: () => {},
};
