// Demo Mode Isolation Module

/**
 * Checks if Demo Mode is safely active.
 * CRITICAL SECURITY REQUIREMENT:
 * - Demo Mode MUST be rejected automatically in production (NODE_ENV === 'production').
 * - In development/local environments, it checks the DEMO_MODE env flag.
 */
export function isDemoModeActive(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Ensures that privileged admin actions in Demo Mode NEVER execute real service-role calls.
 */
export function assertSafeEnvironmentForServiceRole(): void {
  if (isDemoModeActive()) {
    throw new Error('SECURITY VIOLATION: Service role operations are strictly forbidden in Demo Mode.');
  }
}
