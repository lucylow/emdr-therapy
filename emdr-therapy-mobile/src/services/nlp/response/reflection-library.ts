import type { Language } from '../types.ts';

export type ReflectionTopic = 'present_moment' | 'needs' | 'choices' | 'support' | 'values' | 'daily_life' | 'neutral_observation';
export interface ReflectionPrompt { id: string; topic: ReflectionTopic; prompt: string; optionalFollowUp?: string; }

const EN: ReflectionPrompt[] = [
  { id: 'present-01', topic: 'present_moment', prompt: 'What do I notice about my surroundings right now?', optionalFollowUp: 'Which detail feels neutral or ordinary?' },
  { id: 'present-02', topic: 'present_moment', prompt: 'What tells me where I am in the present moment?' },
  { id: 'present-03', topic: 'present_moment', prompt: 'What is one small thing I can see, hear, or touch if I choose?' },
  { id: 'present-04', topic: 'present_moment', prompt: 'What feels steady or familiar in my environment today?' },
  { id: 'present-05', topic: 'present_moment', prompt: 'What would make this moment a little more comfortable?' },
  { id: 'needs-01', topic: 'needs', prompt: 'What do I need in the next ten minutes, if anything?' },
  { id: 'needs-02', topic: 'needs', prompt: 'Would rest, water, a change of space, or a conversation be useful?' },
  { id: 'needs-03', topic: 'needs', prompt: 'What is one need I can name without having to solve everything?' },
  { id: 'needs-04', topic: 'needs', prompt: 'What could I give myself permission not to do right now?' },
  { id: 'needs-05', topic: 'needs', prompt: 'What would a manageable next step look like for today?' },
  { id: 'choices-01', topic: 'choices', prompt: 'What choices are available to me right now?' },
  { id: 'choices-02', topic: 'choices', prompt: 'Would I prefer to continue, pause, stop, or ask someone for support?' },
  { id: 'choices-03', topic: 'choices', prompt: 'Which part of the next step is within my control?' },
  { id: 'choices-04', topic: 'choices', prompt: 'What could I postpone until I feel ready to consider it?' },
  { id: 'choices-05', topic: 'choices', prompt: 'What is a small option I have not considered yet?' },
  { id: 'support-01', topic: 'support', prompt: 'Who is one person I might choose to contact for ordinary support?' },
  { id: 'support-02', topic: 'support', prompt: 'What kind of support would be helpful: company, practical help, or listening?' },
  { id: 'support-03', topic: 'support', prompt: 'What would I like a trusted person to understand about what I need today?' },
  { id: 'support-04', topic: 'support', prompt: 'Would professional guidance help me decide what to do next?' },
  { id: 'support-05', topic: 'support', prompt: 'What is one boundary that would make a conversation feel more manageable?' },
  { id: 'values-01', topic: 'values', prompt: 'What quality would I like to bring to the next small step?' },
  { id: 'values-02', topic: 'values', prompt: 'What matters to me in how I treat myself today?' },
  { id: 'values-03', topic: 'values', prompt: 'What is one ordinary activity that connects with something I value?' },
  { id: 'values-04', topic: 'values', prompt: 'What would a kind, practical response to myself look like?' },
  { id: 'values-05', topic: 'values', prompt: 'What would I like to make room for this week?' },
  { id: 'daily-01', topic: 'daily_life', prompt: 'What is one routine that helps my day feel more predictable?' },
  { id: 'daily-02', topic: 'daily_life', prompt: 'What is a small practical task I could simplify today?' },
  { id: 'daily-03', topic: 'daily_life', prompt: 'Which part of my routine could include a short pause?' },
  { id: 'daily-04', topic: 'daily_life', prompt: 'What is one activity I might enjoy at a comfortable pace?' },
  { id: 'daily-05', topic: 'daily_life', prompt: 'What is one thing I can leave for another day?' },
  { id: 'neutral-01', topic: 'neutral_observation', prompt: 'Write one sentence about something ordinary you noticed today.' },
  { id: 'neutral-02', topic: 'neutral_observation', prompt: 'Describe an object nearby without interpreting or explaining it.' },
  { id: 'neutral-03', topic: 'neutral_observation', prompt: 'List three neutral details about the room you are in.' },
  { id: 'neutral-04', topic: 'neutral_observation', prompt: 'What is the date or time, if you know it?' },
  { id: 'neutral-05', topic: 'neutral_observation', prompt: 'What is one ordinary thing you would like to remember about today?' },
];

const FR: ReflectionPrompt[] = [
  { id: 'present-01', topic: 'present_moment', prompt: 'Qu’est-ce que je remarque dans mon environnement maintenant ?' },
  { id: 'needs-01', topic: 'needs', prompt: 'De quoi ai-je besoin dans les dix prochaines minutes, s’il y a quelque chose ?' },
  { id: 'choices-01', topic: 'choices', prompt: 'Quels choix s’offrent à moi maintenant ?' },
  { id: 'support-01', topic: 'support', prompt: 'Quelle forme de soutien me serait utile : de la présence, une aide pratique ou une écoute ?' },
  { id: 'values-01', topic: 'values', prompt: 'Quelle qualité aimerais-je apporter à la prochaine petite étape ?' },
  { id: 'daily-01', topic: 'daily_life', prompt: 'Quelle petite tâche pourrais-je simplifier aujourd’hui ?' },
  { id: 'neutral-01', topic: 'neutral_observation', prompt: 'Décrivez en une phrase un détail ordinaire remarqué aujourd’hui.' },
];

const ES: ReflectionPrompt[] = [
  { id: 'present-01', topic: 'present_moment', prompt: '¿Qué noto en mi entorno en este momento?' },
  { id: 'needs-01', topic: 'needs', prompt: '¿Qué necesito en los próximos diez minutos, si necesito algo?' },
  { id: 'choices-01', topic: 'choices', prompt: '¿Qué opciones tengo en este momento?' },
  { id: 'support-01', topic: 'support', prompt: '¿Qué tipo de apoyo sería útil: compañía, ayuda práctica o escucha?' },
  { id: 'values-01', topic: 'values', prompt: '¿Qué cualidad quiero aportar al siguiente pequeño paso?' },
  { id: 'daily-01', topic: 'daily_life', prompt: '¿Qué pequeña tarea podría simplificar hoy?' },
  { id: 'neutral-01', topic: 'neutral_observation', prompt: 'Escribe una frase sobre algo cotidiano que hayas notado hoy.' },
];

/** These prompts avoid asking users to relive or narrate traumatic memories. */
export function getReflectionPrompts(language: Language, topic?: ReflectionTopic): ReflectionPrompt[] {
  const source = language === 'fr' ? FR : language === 'es' ? ES : EN;
  return source.filter((item) => !topic || item.topic === topic).map((item) => ({ ...item }));
}
