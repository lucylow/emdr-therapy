export type EndpointDecision={allowed:true;url:string;host:string}|{allowed:false;reason:'invalid-url'|'https-required'|'credentials-forbidden'|'query-forbidden'|'fragment-forbidden'|'port-forbidden'|'host-not-allowlisted'|'local-host-forbidden'};
export type EndpointPolicyOptions={allowedHosts:readonly string[];allowQuery?:boolean;allowSubdomains?:boolean;allowedPorts?:readonly number[]};
/** Local validation before a host configures an optional remote-provider URL. DNS/egress policy is still host-owned. */
export function validateProviderEndpoint(value:string,options:EndpointPolicyOptions):EndpointDecision{
 let url:URL;try{url=new URL(value);}catch{return{allowed:false,reason:'invalid-url'};}
 if(url.protocol!=='https:')return{allowed:false,reason:'https-required'};
 if(url.username||url.password)return{allowed:false,reason:'credentials-forbidden'};
 if(url.hash)return{allowed:false,reason:'fragment-forbidden'};
 if(url.search&&!options.allowQuery)return{allowed:false,reason:'query-forbidden'};
 const host=url.hostname.toLowerCase().replace(/\.$/,'');
 if(isLocalHost(host))return{allowed:false,reason:'local-host-forbidden'};
 const port=url.port?Number(url.port):443;const allowedPorts=options.allowedPorts??[443];if(!allowedPorts.includes(port))return{allowed:false,reason:'port-forbidden'};
 const allowed=options.allowedHosts.map(normalizeHost).filter(Boolean) as string[];
 const found=allowed.some(entry=>host===entry||(options.allowSubdomains===true&&host.endsWith(`.${entry}`)));
 if(!found)return{allowed:false,reason:'host-not-allowlisted'};
 url.hostname=host;return{allowed:true,url:url.toString(),host};
}
export function normalizeAllowedHost(value:string):string|undefined{return normalizeHost(value);}
function normalizeHost(value:string):string|undefined{const host=value.trim().toLowerCase().replace(/\.$/,'');if(!host||host.includes('/')||host.includes(':')||host.includes('@')||host.includes('*')||isLocalHost(host))return undefined;return /^[a-z0-9.-]{1,253}$/.test(host)&&!host.includes('..')?host:undefined;}
function isLocalHost(host:string):boolean{return host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host==='127.0.0.1'||host==='0.0.0.0'||host==='::1'||host.startsWith('10.')||host.startsWith('192.168.')||/^172\.(1[6-9]|2\d|3[01])\./.test(host);}
