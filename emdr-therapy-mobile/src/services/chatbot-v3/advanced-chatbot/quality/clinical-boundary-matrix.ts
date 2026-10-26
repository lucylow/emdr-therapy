import type { Locale } from '../types.ts';
import { detectClinicalBoundary, type BoundaryCategory } from '../policy/clinical-boundary.ts';
export type BoundaryFixture={id:string;locale:Locale;input:string;expected:BoundaryCategory};
export type BoundaryFixtureResult={id:string;passed:boolean;expected:BoundaryCategory;actual:BoundaryCategory};
export type BoundaryMatrixReport={total:number;passed:number;failed:number;results:BoundaryFixtureResult[];accuracy:number};

/** Deterministic fixtures for boundary copy routing. This evaluates keyword rules, not clinical risk. */
export const CLINICAL_BOUNDARY_FIXTURES: readonly BoundaryFixture[] = [
 {id:'en-diagnosis-1',locale:'en',input:'Do I have PTSD?',expected:'diagnosis'},
 {id:'en-diagnosis-2',locale:'en',input:'Can you diagnose my anxiety?',expected:'diagnosis'},
 {id:'en-medication-1',locale:'en',input:'Should I stop my medication?',expected:'medication'},
 {id:'en-medication-2',locale:'en',input:'Tell me how to change my meds.',expected:'medication'},
 {id:'en-treatment-1',locale:'en',input:'What treatment should I choose?',expected:'treatment-advice'},
 {id:'en-trauma-1',locale:'en',input:'Walk me through processing my trauma alone.',expected:'trauma-processing'},
 {id:'fr-diagnosis-1',locale:'fr',input:'Peux-tu diagnostiquer mon anxiété?',expected:'diagnosis'},
 {id:'fr-medication-1',locale:'fr',input:'Dois-je arrêter mes médicaments?',expected:'medication'},
 {id:'fr-treatment-1',locale:'fr',input:'Quel traitement devrais-je choisir?',expected:'treatment-advice'},
 {id:'fr-trauma-1',locale:'fr',input:'Guide-moi pour retraiter mon traumatisme seul.',expected:'trauma-processing'},
 {id:'es-diagnosis-1',locale:'es',input:'¿Tengo TEPT?',expected:'diagnosis'},
 {id:'es-medication-1',locale:'es',input:'¿Debo dejar mi medicación?',expected:'medication'},
 {id:'es-treatment-1',locale:'es',input:'¿Qué tratamiento debería elegir?',expected:'treatment-advice'},
 {id:'es-trauma-1',locale:'es',input:'Guíame para procesar el trauma sin terapeuta.',expected:'trauma-processing'},
 {id:'neutral-app-help',locale:'en',input:'Where are the privacy settings?',expected:'none'},
 {id:'neutral-grounding',locale:'en',input:'Can you offer a simple grounding exercise?',expected:'none'},
 {id:'neutral-french-app',locale:'fr',input:'Où sont les paramètres de confidentialité?',expected:'none'},
 {id:'neutral-spanish-app',locale:'es',input:'¿Dónde están los ajustes de privacidad?',expected:'none'},
];
export function evaluateClinicalBoundaryMatrix(fixtures:readonly BoundaryFixture[]=CLINICAL_BOUNDARY_FIXTURES,detector:(text:string,locale:Locale)=>BoundaryCategory=detectClinicalBoundary):BoundaryMatrixReport{
 const results=fixtures.map(f=>{const actual=detector(f.input,f.locale);return{id:f.id,expected:f.expected,actual,passed:actual===f.expected};});
 const passed=results.filter(r=>r.passed).length;return{total:results.length,passed,failed:results.length-passed,results,accuracy:results.length?passed/results.length:1};
}
