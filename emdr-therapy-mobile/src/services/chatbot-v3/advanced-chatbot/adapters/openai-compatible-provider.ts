import type { ChatModelProvider, ModelRequest, ModelResult } from '../types.ts';
export type FetchResponseLike={ok:boolean;status:number;json:()=>Promise<unknown>};
export type FetchLike=(input:string,init:{method:'POST';headers:Record<string,string>;body:string;signal?:AbortSignal})=>Promise<FetchResponseLike>;
export type OpenAICompatibleOptions={endpoint:string;model:string;apiKey?:()=>string|undefined;fetcher:FetchLike;extraHeaders?:Record<string,string>;maxResponseChars?:number};
/** Optional adapter only; host must provide explicit consent, endpoint, fetch implementation, and secret supplier. */
export class OpenAICompatibleProvider implements ChatModelProvider {
  constructor(private options:OpenAICompatibleOptions){validateEndpoint(options.endpoint);if(!options.model.trim())throw new Error('model is required');}
  async generate(request:ModelRequest,signal?:AbortSignal):Promise<ModelResult> {
    const key=this.options.apiKey?.();const headers:Record<string,string>={'content-type':'application/json',...sanitizeHeaders(this.options.extraHeaders)};
    if(key)headers.authorization=`Bearer ${key}`;
    const messages=[{role:'system',content:request.system},{...{role:'user'},content:request.user},...request.context.map(m=>({role:m.role,content:m.content}))];
    const body=JSON.stringify({model:this.options.model,messages,temperature:0.2,max_tokens:request.maxOutputTokens,stream:false});
    const response=await this.options.fetcher(this.options.endpoint,{method:'POST',headers,body,signal});
    if(!response.ok)throw new Error(`provider-http-${response.status}`);
    const payload=await response.json();const text=extractText(payload);
    if(!text)throw new Error('provider-empty-content');if(text.length>(this.options.maxResponseChars??12000))throw new Error('provider-response-too-large');
    return {text,provider:this.options.model};
  }
}
function validateEndpoint(value:string):void {let url:URL;try{url=new URL(value);}catch{throw new Error('endpoint must be an absolute URL');}if(url.protocol!=='https:'&&url.hostname!=='localhost'&&url.hostname!=='127.0.0.1')throw new Error('endpoint must use HTTPS unless local development');if(url.username||url.password)throw new Error('credentials must not be embedded in endpoint URL');}
function sanitizeHeaders(headers:Record<string,string>|undefined):Record<string,string>{const out:Record<string,string>={};for(const [k,v] of Object.entries(headers??{})){if(!/^[a-z0-9-]{1,50}$/i.test(k)||k.toLowerCase()==='authorization'||/[\r\n]/.test(v))continue;out[k]=v.slice(0,500);}return out;}
function extractText(payload:unknown):string {
 if(!payload||typeof payload!=='object')return '';const choices=(payload as {choices?:unknown[]}).choices;if(!Array.isArray(choices)||!choices.length)return '';
 const first=choices[0] as {message?:{content?:unknown};text?:unknown};const content=first?.message?.content??first?.text;
 if(typeof content==='string')return content.trim();if(Array.isArray(content))return content.map(part=>part&&typeof part==='object'&&typeof (part as {text?:unknown}).text==='string'?(part as {text:string}).text:'').join('').trim();return '';
}
