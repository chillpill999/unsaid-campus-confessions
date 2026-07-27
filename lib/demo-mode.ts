export function isDemoModeActive(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.DEMO_MODE === 'true';
}

export function assertSafeEnvironmentForServiceRole(): void {
  if (isDemoModeActive()) {
    throw new Error('SECURITY VIOLATION: Service role operations are strictly forbidden in Demo Mode.');
  }
}
