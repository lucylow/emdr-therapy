export const MAX_TRANSCRIPT_CHARACTERS = 12000;

export function redactTranscript(input: string) { const capped = input.slice(0, MAX_TRANSCRIPT_CHARACTERS); return capped.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]').replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[phone redacted]').replace(/\b(?:MRN|medical record number)\s*[:#]?\s*[A-Z0-9-]+\b/gi, '[record identifier redacted]'); }

export const TRANSCRIPT_BOUNDARY = 'Use only de-identified text with applicable consent. This boundary is a simple prototype safeguard, not a complete privacy or clinical governance system.';
