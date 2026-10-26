import type { Language } from '../types.ts';

export interface GroundingStep { id: string; text: string; optional: boolean; }
export interface GroundingExercise { id: string; title: string; description: string; steps: GroundingStep[]; estimatedSeconds: number; };

const EXERCISES: Record<'en' | 'fr' | 'es', GroundingExercise[]> = {
  en: [
    { id: 'orient-room', title: 'Orient to the room', description: 'A neutral present-moment exercise. Skip any step that does not feel comfortable.', estimatedSeconds: 45, steps: [
      { id: 'where', text: 'Notice the room or place you are in, without needing to change anything.', optional: false },
      { id: 'contact', text: 'Notice one point of contact, such as your feet on the floor or your back against a chair.', optional: true },
      { id: 'objects', text: 'Name three ordinary objects you can see, silently or aloud.', optional: true },
      { id: 'choice', text: 'Decide whether you want to continue, pause, or stop.', optional: false },
    ] },
    { id: 'five-senses', title: 'Gentle senses check', description: 'No need to close your eyes or focus on internal sensations.', estimatedSeconds: 60, steps: [
      { id: 'see', text: 'Notice three colors or shapes around you.', optional: true },
      { id: 'hear', text: 'Notice a neutral sound in the environment, or skip this step.', optional: true },
      { id: 'touch', text: 'Notice the texture of an object nearby if you choose.', optional: true },
      { id: 'orient', text: 'Remind yourself where you are and that you can stop this exercise.', optional: false },
    ] },
  ],
  fr: [
    { id: 'orient-room', title: 'S’orienter dans la pièce', description: 'Exercice neutre dans le présent. Ignorez toute étape inconfortable.', estimatedSeconds: 45, steps: [
      { id: 'where', text: 'Remarquez la pièce ou le lieu où vous vous trouvez.', optional: false },
      { id: 'contact', text: 'Remarquez un point de contact, comme les pieds au sol ou le dos contre une chaise.', optional: true },
      { id: 'objects', text: 'Nommez trois objets ordinaires que vous voyez.', optional: true },
      { id: 'choice', text: 'Choisissez de continuer, de faire une pause ou d’arrêter.', optional: false },
    ] },
  ],
  es: [
    { id: 'orient-room', title: 'Orientarse en la habitación', description: 'Ejercicio neutral en el presente. Omite cualquier paso que resulte incómodo.', estimatedSeconds: 45, steps: [
      { id: 'where', text: 'Observa la habitación o el lugar donde estás.', optional: false },
      { id: 'contact', text: 'Nota un punto de contacto, como los pies en el suelo o la espalda contra una silla.', optional: true },
      { id: 'objects', text: 'Nombra tres objetos comunes que puedas ver.', optional: true },
      { id: 'choice', text: 'Decide si deseas continuar, pausar o detenerte.', optional: false },
    ] },
  ],
};

export function getGroundingExercises(language: Language): GroundingExercise[] {
  const locale = language === 'fr' ? 'fr' : language === 'es' ? 'es' : 'en';
  return EXERCISES[locale].map((exercise) => ({ ...exercise, steps: exercise.steps.map((step) => ({ ...step })) }));
}
