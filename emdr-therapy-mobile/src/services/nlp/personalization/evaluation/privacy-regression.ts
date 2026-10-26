import { auditObjectForSensitiveFields } from '../privacy/audit.ts';
import type { LocalDataBundle } from '../core/types.ts';

export interface PrivacyRegressionResult {
  readonly passed: boolean;
  readonly issueCount: number;
  readonly findings: readonly { path: string; code: string }[];
}

export function runPrivacyRegression(bundle: LocalDataBundle): PrivacyRegressionResult {
  const findings = auditObjectForSensitiveFields(bundle);
  return { passed: findings.length === 0, issueCount: findings.length, findings };
}

export function assertNoRawTextStored(bundle: LocalDataBundle): void {
  const result = runPrivacyRegression(bundle);
  if (!result.passed) throw new Error(`Privacy regression failed with ${result.issueCount} finding(s)`);
}

export function isStrictLocalOnlyMode(config: { readonly remoteEnabled?: boolean; readonly consented?: boolean; readonly sendsRawText?: boolean }): boolean {
  return !config.remoteEnabled && !config.consented && !config.sendsRawText;
}
