export type CancellationHandle={signal:AbortSignal;cancel:()=>void;isCancelled:()=>boolean};
export function createCancellationHandle():CancellationHandle {
 const controller=new AbortController();let cancelled=false;
 return {signal:controller.signal,cancel:()=>{if(!cancelled){cancelled=true;controller.abort();}},isCancelled:()=>cancelled};
}
export async function withAbort<T>(promise:Promise<T>,signal:AbortSignal):Promise<T> {
 if(signal.aborted)throw new Error('cancelled');
 return await new Promise<T>((resolve,reject)=>{
  const onAbort=()=>reject(new Error('cancelled'));signal.addEventListener('abort',onAbort,{once:true});
  promise.then(value=>{signal.removeEventListener('abort',onAbort);resolve(value);},error=>{signal.removeEventListener('abort',onAbort);reject(error);});
 });
}
