import { reviewGeneratedText } from '../policy/output-validator.ts';
import { clampText, truncateAtBoundary } from '../text.ts';
export type StreamSnapshot={text:string;done:boolean;blocked:boolean;reason?:string};
/** Buffers streaming chunks until the host receives a reviewed final response. */
export class ReviewedStreamBuffer {
  private chunks:string[]=[];private length=0;private closed=false;private blocked=false;private reason?:string;
  constructor(private readonly maxChars=1800){}
  push(chunk:unknown):StreamSnapshot {
    if(this.closed)return this.snapshot();
    if(typeof chunk!=='string'||chunk.length===0)return this.snapshot();
    const clean=clampText(chunk,this.maxChars+1);
    if(this.length+clean.length>this.maxChars){this.blocked=true;this.reason='stream-output-limit';this.closed=true;this.chunks=[];this.length=0;return this.snapshot();}
    // Never expose raw chunks to the UI while policy validation is incomplete.
    this.chunks.push(clean);this.length+=clean.length;return this.snapshot();
  }
  finish():StreamSnapshot {
    if(this.closed)return this.snapshot();this.closed=true;
    const joined=this.chunks.join('');const reviewed=reviewGeneratedText(joined,this.maxChars);
    if(!reviewed.accepted){this.blocked=true;this.reason='stream-output-review-failed';this.chunks=[];this.length=0;}
    else {this.chunks=[truncateAtBoundary(reviewed.text,this.maxChars)];this.length=this.chunks[0].length;}
    return this.snapshot();
  }
  cancel():void{this.closed=true;this.chunks=[];this.length=0;this.reason='cancelled';}
  snapshot():StreamSnapshot{return {text:this.blocked?'':this.chunks.join(''),done:this.closed,blocked:this.blocked,reason:this.reason};}
}
