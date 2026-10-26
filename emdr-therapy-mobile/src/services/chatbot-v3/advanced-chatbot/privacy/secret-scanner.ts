export type SecretFinding={kind:'email'|'phone'|'api-key'|'bearer-token'|'query-secret'|'private-key'|'credit-card';start:number;end:number;sample:string};
const RULES:Array<{kind:SecretFinding['kind'];regex:RegExp}>=[
 {kind:'private-key',regex:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi},
 {kind:'bearer-token',regex:/\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi},
 {kind:'api-key',regex:/\b(?:sk-[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{25,}|gh[pousr]_[A-Za-z0-9]{20,})\b/g},
 {kind:'email',regex:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi},
 {kind:'phone',regex:/(?<!\w)(?:\+?\d[\d ()-]{8,}\d)(?!\w)/g},
 {kind:'query-secret',regex:/(?:^|[?&])(?:token|key|secret|password|api_key)=[^&#\s]+/gi},
 {kind:'credit-card',regex:/\b(?:\d[ -]*?){13,19}\b/g},
];
export function scanSecrets(text:string):SecretFinding[]{const out:SecretFinding[]=[];for(const {kind,regex} of RULES){regex.lastIndex=0;let m:RegExpExecArray|null;while((m=regex.exec(text))!==null){const raw=m[0];if(kind==='credit-card'&&!luhn(raw))continue;out.push({kind,start:m.index,end:m.index+raw.length,sample:raw.slice(0,3)+'…'});if(!raw.length)regex.lastIndex++;}}return out.sort((a,b)=>a.start-b.start||a.end-b.end);}
export function redactSecrets(text:string,mask='[REDACTED]'):string{const findings=scanSecrets(text);let output=text;for(const f of findings.slice().sort((a,b)=>b.start-a.start))output=output.slice(0,f.start)+mask+output.slice(f.end);return output;}
export function auditOutboundText(text:string,options:{maxChars?:number;allowEmail?:boolean}={}):{ok:boolean;reasons:string[];redacted:string;findings:SecretFinding[]}{const findings=scanSecrets(text);const effective=options.allowEmail?findings.filter(f=>f.kind!=='email'):findings;const redacted=redactSecrets(text);const reasons:string[]=[];if(text.length>(options.maxChars??4000))reasons.push('payload-too-large');if(effective.length)reasons.push(...new Set(effective.map(f=>`possible-${f.kind}`)));return{ok:reasons.length===0,reasons,redacted,findings};}
function luhn(value:string):boolean{const digits=value.replace(/\D/g,'');if(digits.length<13||digits.length>19)return false;let sum=0,alt=false;for(let i=digits.length-1;i>=0;i--){let n=Number(digits[i]);if(alt){n*=2;if(n>9)n-=9;}sum+=n;alt=!alt;}return sum%10===0;}
