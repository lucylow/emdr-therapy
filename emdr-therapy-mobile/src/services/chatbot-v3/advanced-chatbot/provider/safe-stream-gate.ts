import type { Locale } from '../types.ts';
import { reviewGeneratedText } from '../policy/output-validator.ts';
import { lintGeneratedClaim } from '../policy/claim-linter.ts';

export type SafeStreamStatus = 'buffering' | 'released' | 'rejected' | 'cancelled' | 'overflow';
export type SafeStreamResult = { status: Exclude<SafeStreamStatus, 'buffering'>; text: string; reasons: string[]; bufferedChars: number };
export type SafeStreamOptions = { locale: Locale; maxChars?: number; maxChunks?: number; maxChunkChars?: number };

/** Buffers untrusted model chunks until the complete answer passes the final response checks.
 * It intentionally does not expose partial tokens to the UI before review. */
export class SafeStreamGate {
  private state: SafeStreamStatus = 'buffering';
  private chunks: string[] = [];
  private chars = 0;
  private readonly maxChars: number;
  private readonly maxChunks: number;
  private readonly maxChunkChars: number;
  constructor(private readonly options: SafeStreamOptions) {
    this.maxChars = bound(options.maxChars ?? 6000, 128, 24000);
    this.maxChunks = bound(options.maxChunks ?? 500, 1, 4000);
    this.maxChunkChars = bound(options.maxChunkChars ?? 1024, 8, 8192);
  }
  get status(): SafeStreamStatus { return this.state; }
  get bufferedChars(): number { return this.chars; }
  push(chunk: string): { released: false; status: SafeStreamStatus } {
    if (this.state !== 'buffering') return { released: false, status: this.state };
    if (typeof chunk !== 'string' || chunk.length > this.maxChunkChars || this.chunks.length >= this.maxChunks || this.chars + chunk.length > this.maxChars) {
      this.state = 'overflow'; this.clearBuffer(); return { released: false, status: this.state };
    }
    this.chunks.push(chunk); this.chars += chunk.length;
    return { released: false, status: this.state };
  }
  finish(): SafeStreamResult {
    if (this.state === 'cancelled' || this.state === 'overflow' || this.state === 'rejected') {
      return { status: this.state, text: '', reasons: [`stream-${this.state}`], bufferedChars: this.chars };
    }
    if (this.state === 'released') return { status: 'rejected', text: '', reasons: ['stream-already-finalized'], bufferedChars: this.chars };
    const raw = this.chunks.join('');
    const review = reviewGeneratedText(raw, this.maxChars);
    const claim = review.accepted ? lintGeneratedClaim(review.text, this.options.locale) : undefined;
    if (!review.accepted || !claim?.safe) {
      const reasons = [...review.reasons, ...(claim?.issues ?? [])];
      this.state = 'rejected'; this.clearBuffer();
      return { status: 'rejected', text: '', reasons: reasons.length ? reasons : ['response-review-failed'], bufferedChars: this.chars };
    }
    this.state = 'released'; this.chunks = [];
    return { status: 'released', text: claim.cleanText, reasons: [], bufferedChars: this.chars };
  }
  cancel(): SafeStreamResult {
    if (this.state === 'released') return { status: 'released', text: '', reasons: ['already-released'], bufferedChars: this.chars };
    this.state = 'cancelled'; this.clearBuffer();
    return { status: 'cancelled', text: '', reasons: ['cancelled-by-host'], bufferedChars: this.chars };
  }
  private clearBuffer(): void { this.chunks = []; this.chars = 0; }
}
function bound(v: number, min: number, max: number): number { return Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : min; }
