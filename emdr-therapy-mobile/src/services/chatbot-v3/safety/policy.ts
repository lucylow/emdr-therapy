import type { SafetyResult, Language } from '../types.ts';

export interface SafetyCopy { response: string; actions: Array<'stop' | 'grounding' | 'contact_support'>; urgent: boolean; }

export function createSafetyResponse(safety: SafetyResult, language: Language): SafetyCopy | null {
  if (safety.level === 'none') return null;
  const fr = language === 'fr';
  const es = language === 'es';
  if (safety.needsImmediateSupport || safety.level === 'imminent') {
    const response = fr
      ? "Votre sécurité passe avant tout. Arrêtez l'exercice maintenant. Si vous êtes en danger immédiat, appelez les services d'urgence locaux ou rendez-vous aux urgences. Si possible, rapprochez-vous d'une personne de confiance et dites-lui clairement que vous avez besoin d'aide tout de suite."
      : es
        ? 'Tu seguridad es lo primero. Detén el ejercicio ahora. Si hay peligro inmediato, llama a los servicios de emergencia locales o acude a urgencias. Si puedes, busca a una persona de confianza y dile claramente que necesitas ayuda ahora.'
        : 'Your safety comes first. Stop the exercise now. If you may act on these thoughts or someone is in immediate danger, contact local emergency services or go to an emergency department. If possible, move near a trusted person and tell them you need immediate support.';
    return { response, actions: ['stop', 'contact_support'], urgent: true };
  }
  if (safety.level === 'high') {
    const response = fr
      ? "Merci de me l'avoir dit. Je ne peux pas évaluer votre sécurité, mais ce que vous décrivez mérite un soutien humain maintenant. Mettez l'exercice en pause et contactez une personne de confiance, un professionnel ou un service de crise local. Êtes-vous en danger immédiat en ce moment ?"
      : es
        ? 'Gracias por decírmelo. No puedo evaluar tu seguridad, pero esto merece apoyo humano ahora. Pausa el ejercicio y contacta a alguien de confianza, un profesional o un servicio de crisis local. ¿Estás en peligro inmediato en este momento?'
        : 'Thank you for telling me. I can’t assess your safety, but this deserves human support now. Pause the exercise and contact someone you trust, a professional, or a local crisis service. Are you in immediate danger right now?';
    return { response, actions: ['stop', 'contact_support'], urgent: false };
  }
  const response = fr
    ? "Cela semble très difficile. Vous pouvez mettre l'exercice en pause ou l'arrêter. Si cela concerne votre sécurité, dites-le à une personne de confiance ou à un professionnel. Voulez-vous faire un exercice d'ancrage neutre ?"
    : es
      ? 'Esto suena muy difícil. Puedes pausar o detener el ejercicio. Si esto tiene que ver con tu seguridad, cuéntaselo a alguien de confianza o a un profesional. ¿Quieres probar un ejercicio neutral de orientación al presente?'
      : 'That sounds difficult. You can pause or stop the exercise at any time. If this concerns your safety, consider telling someone you trust or a qualified professional. Would a neutral grounding exercise feel helpful right now?';
  return { response, actions: ['stop', 'grounding', 'contact_support'], urgent: false };
}
