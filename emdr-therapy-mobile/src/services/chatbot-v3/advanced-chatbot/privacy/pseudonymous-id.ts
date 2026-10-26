import { stableHash } from '../text.ts';
/** A local non-cryptographic pseudonym for deduplicating short-lived QA samples; not an anonymization guarantee. */
export function pseudonymousId(value:string,salt:string):string {
 if(!salt||salt.length<8)throw new Error('Use a non-empty app-scoped salt of at least 8 characters');
 return stableHash(`${salt}:${value}`).slice(0,8);
}
export function rotatePseudonym(value:string,oldSalt:string,newSalt:string):{oldId:string;newId:string}{return {oldId:pseudonymousId(value,oldSalt),newId:pseudonymousId(value,newSalt)};}
export function idsMatch(a:string,b:string):boolean{return /^[a-f0-9]{8}$/i.test(a)&&a===b;}
