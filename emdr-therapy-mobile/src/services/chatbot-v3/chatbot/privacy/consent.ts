import type { ChatConsent } from '../types.ts';

export const DEFAULT_CHAT_CONSENT: Readonly<ChatConsent> = Object.freeze({
  remoteProcessing: false,
  sendConversationHistory: false,
  retainLocalConversationText: false,
  anonymousProductAnalytics: false,
});

/** Missing, null, and non-boolean consent values are treated as false. */
export function normalizeChatConsent(input?: Partial<ChatConsent>): ChatConsent {
  return {
    remoteProcessing: input?.remoteProcessing === true,
    sendConversationHistory: input?.sendConversationHistory === true,
    retainLocalConversationText: input?.retainLocalConversationText === true,
    anonymousProductAnalytics: input?.anonymousProductAnalytics === true,
  };
}

export function maySendCurrentMessage(consent: ChatConsent, localOnly: boolean | undefined, configAllowsRemote: boolean): boolean {
  return consent.remoteProcessing && localOnly !== true && configAllowsRemote;
}

export function maySendConversationHistory(consent: ChatConsent, configAllowsRemote: boolean): boolean {
  return consent.remoteProcessing && consent.sendConversationHistory && consent.retainLocalConversationText && configAllowsRemote;
}

export function consentSummary(consent: ChatConsent): Array<{ feature: keyof ChatConsent; enabled: boolean }> {
  return [
    { feature: 'remoteProcessing', enabled: consent.remoteProcessing },
    { feature: 'sendConversationHistory', enabled: consent.sendConversationHistory },
    { feature: 'retainLocalConversationText', enabled: consent.retainLocalConversationText },
    { feature: 'anonymousProductAnalytics', enabled: consent.anonymousProductAnalytics },
  ];
}
