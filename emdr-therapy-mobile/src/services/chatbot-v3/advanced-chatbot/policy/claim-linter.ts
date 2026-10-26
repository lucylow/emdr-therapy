import type { Locale } from '../types.ts';
export type ClaimIssue='diagnostic-claim'|'guaranteed-outcome'|'treatment-prescription'|'clinical-effect-claim'|'unsupported-capability';
export type ClaimLintResult={safe:boolean;issues:ClaimIssue[];cleanText:string};
const PATTERNS:Array<[ClaimIssue,RegExp]>=[
 ['diagnostic-claim',/\b(you have (?:ptsd|anxiety|depression|a disorder)|you are diagnosed with|your diagnosis is)\b/i],
 ['guaranteed-outcome',/\b(guaranteed to (?:cure|heal)|will definitely (?:cure|fix)|100% effective|works for everyone)\b/i],
 ['treatment-prescription',/\b(you should (?:stop|start|change) (?:your )?(?:medication|meds)|you must process your trauma|do this trauma reprocessing now)\b/i],
 ['clinical-effect-claim',/\b(this app (?:treats|cures|prevents|heals) (?:ptsd|trauma|anxiety|depression)|emdr here will cure)\b/i],
 ['unsupported-capability',/\b(i have (?:started|paused|stopped) your session|i changed your settings automatically|i deleted your data)\b/i],
];
const WORDS:Record<Locale,string>={en:'I can share general app information, but I cannot diagnose or guarantee treatment outcomes. Please verify any settings change in the app.',fr:'Je peux fournir des informations générales sur l’application, mais je ne peux pas poser de diagnostic ni garantir un résultat de traitement. Vérifiez tout changement dans l’application.',es:'Puedo ofrecer información general sobre la aplicación, pero no diagnosticar ni garantizar resultados de tratamiento. Verifica cualquier cambio en la aplicación.'};
export function lintGeneratedClaim(text:string,locale:Locale):ClaimLintResult {const issues=PATTERNS.filter(([,rx])=>rx.test(text)).map(([id])=>id);return{safe:issues.length===0,issues,cleanText:issues.length?WORDS[locale]:text};}
export function containsUnsafeClaim(text:string):boolean{return PATTERNS.some(([,rx])=>rx.test(text));}
