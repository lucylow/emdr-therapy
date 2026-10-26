export interface ProcessingConsent {
  localProcessing: true;
  remoteProcessing: boolean;
  remoteProvider?: string;
  consentedAt?: number;
  version: string;
}

/** Runtime consent guard. The host app must persist consent only with a reviewed policy. */
export class ConsentController {
  private state: ProcessingConsent = { localProcessing: true, remoteProcessing: false, version: '1' };

  current(): ProcessingConsent { return { ...this.state }; }

  grantRemote(provider: string, version: string, now = Date.now()): ProcessingConsent {
    const providerName = String(provider ?? '').trim().slice(0, 100);
    if (!providerName) throw new Error('A named remote provider is required for consent.');
    this.state = { localProcessing: true, remoteProcessing: true, remoteProvider: providerName, consentedAt: now, version: String(version).slice(0, 40) };
    return this.current();
  }

  revokeRemote(): ProcessingConsent {
    this.state = { localProcessing: true, remoteProcessing: false, version: this.state.version };
    return this.current();
  }

  canSendRemote(): boolean {
    return this.state.localProcessing && this.state.remoteProcessing && Boolean(this.state.remoteProvider && typeof this.state.consentedAt === 'number');
  }
}
