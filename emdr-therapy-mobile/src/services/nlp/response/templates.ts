import type { Intent, Language } from '../types.ts';

type TemplateBucket = Partial<Record<Intent, string[]>>;
const EN: TemplateBucket = {
  greeting: ['Hello. I can help with app controls, neutral grounding, breathing guidance, or reflection prompts.'],
  goodbye: ['Take care. You can return whenever it feels useful.'],
  grounding_request: [
    'Let’s keep this simple and neutral. Notice your feet or another point of contact with the chair. If comfortable, name three ordinary things you can see. You can stop at any time.',
    'Try orienting to the room rather than to difficult memories: name the place you are in, the current date if you know it, and one object nearby. Skip anything that does not feel comfortable.',
  ],
  breathing_request: [
    'If it feels comfortable, let your breathing remain natural and gently notice one exhale. There is no need to take deep breaths or hold your breath. Stop if you feel dizzy or uncomfortable.',
    'You can simply notice the next breath without changing it. If focusing on breathing feels uncomfortable, switch to noticing your surroundings instead.',
  ],
  explain_app: ['This app offers configurable bilateral-stimulation controls and optional wellbeing tools. It cannot diagnose or provide psychotherapy, and it does not replace care from a qualified EMDR clinician.'],
  configure_stimulation: ['You can change sensory settings in the app controls. Choose a slower or less intense option, mute audio, enable reduced motion, or stop entirely whenever you prefer.'],
  session_ready: ['Before continuing, check that you feel comfortable and know where the pause and stop controls are. This tool is not a substitute for EMDR treatment with a qualified clinician.'],
  pause_request: ['Paused request recognized. If the stimulation is active, use the visible Pause control now. You are free to stop or leave the screen at any time.'],
  stop_request: ['Stop request recognized. Use the visible Stop control now; the NLP module itself does not control the audio or animation engine.'],
  distress_share: ['Thank you for sharing that. I won’t assume what it means. It may help to pause the stimulation and orient to your current surroundings. Would you prefer a neutral grounding prompt or simply to pause?'],
  positive_share: ['I’m glad you noticed a change. I can’t determine what caused it, but you can take a moment to notice what feels helpful and decide for yourself what to do next.'],
  reflection_request: ['A gentle reflection prompt: “What do I notice in the present moment, and what would help me feel supported right now?” You do not need to write about memories or details you would rather not revisit.'],
  privacy_question: ['This NLP module runs locally and does not send message text to a server. The app’s overall privacy depends on how the host app stores notes, analytics, logs, and account data. Do not enter identifying or highly sensitive information unless you understand the app’s privacy policy.'],
  professional_support_request: ['A licensed mental-health professional trained in EMDR can discuss whether EMDR is appropriate for you. This app cannot assess clinical suitability or replace professional care.'],
  safety_concern: ['I’m taking your safety concern seriously. You can pause or stop the exercise now. If there may be immediate danger, contact local emergency services or a trusted person nearby.'],
  feedback: ['Thank you for the feedback. Describe the app behavior rather than including personal or clinical details; this local NLP module does not create a support ticket automatically.'],
  unknown: ['I may not have understood that. Would you like help with grounding, breathing, app controls, privacy, or a reflection prompt?'],
};

const FR: TemplateBucket = {
  greeting: ['Bonjour. Je peux vous aider avec les commandes, un exercice d’ancrage neutre, la respiration ou une question de réflexion.'],
  goodbye: ['Prenez soin de vous. Vous pouvez revenir lorsque cela vous sera utile.'],
  grounding_request: ['Restons dans le présent. Si cela vous convient, sentez vos pieds au sol ou votre contact avec la chaise, puis nommez trois objets ordinaires dans la pièce. Vous pouvez arrêter à tout moment.'],
  breathing_request: ['Si cela vous convient, remarquez simplement une expiration sans forcer ni retenir votre souffle. Si vous vous sentez étourdi ou inconfortable, arrêtez et orientez-vous vers la pièce.'],
  explain_app: ['Cette application propose des commandes de stimulation bilatérale et des outils facultatifs de bien-être. Elle ne remplace pas une psychothérapie ou les soins d’un clinicien EMDR qualifié.'],
  configure_stimulation: ['Vous pouvez modifier les réglages sensoriels dans l’application : ralentir, couper le son, réduire les mouvements ou arrêter complètement.'],
  session_ready: ['Avant de continuer, vérifiez que vous êtes à l’aise et que vous savez où se trouvent les commandes Pause et Arrêter. Cet outil ne remplace pas un suivi EMDR professionnel.'],
  pause_request: ['Demande de pause reconnue. Utilisez maintenant la commande Pause visible si la stimulation est active. Vous pouvez aussi arrêter ou quitter l’écran.'],
  stop_request: ['Demande d’arrêt reconnue. Utilisez la commande Arrêter visible ; ce module ne contrôle pas directement l’audio ou l’animation.'],
  distress_share: ['Merci de me l’avoir dit. Je ne vais pas supposer ce que cela signifie. Vous pourriez mettre la stimulation en pause et observer ce qui vous entoure. Préférez-vous un ancrage neutre ou une pause ?'],
  positive_share: ['Merci d’avoir partagé ce changement. Je ne peux pas en déterminer la cause, mais vous pouvez remarquer ce qui vous semble utile et choisir la suite.'],
  reflection_request: ['Question de réflexion douce : « Qu’est-ce que je remarque dans le moment présent, et de quel soutien ai-je besoin maintenant ? » Vous n’avez pas à décrire des souvenirs difficiles.'],
  privacy_question: ['Ce module NLP fonctionne localement et n’envoie pas le texte à un serveur. La confidentialité globale dépend du stockage, des journaux et des analyses de l’application hôte.'],
  professional_support_request: ['Un professionnel de la santé mentale formé à l’EMDR peut discuter de l’adéquation de cette approche. Cette application ne remplace pas des soins professionnels.'],
  safety_concern: ['Je prends votre sécurité au sérieux. Vous pouvez mettre l’exercice en pause ou l’arrêter. En cas de danger immédiat, contactez les services d’urgence locaux ou une personne de confiance.'],
  feedback: ['Merci pour vos commentaires. Décrivez le comportement de l’application sans inclure de détails personnels ou cliniques.'],
  unknown: ['Je n’ai peut-être pas compris. Souhaitez-vous de l’aide pour l’ancrage, la respiration, les commandes de l’application, la confidentialité ou une réflexion ?'],
};

const ES: TemplateBucket = {
  greeting: ['Hola. Puedo ayudarte con los controles, una orientación neutral al presente, respiración o una pregunta de reflexión.'],
  goodbye: ['Cuídate. Puedes volver cuando te resulte útil.'],
  grounding_request: ['Mantengamos la atención en el presente. Si te resulta cómodo, nota tus pies en el suelo o el contacto con la silla y nombra tres objetos comunes. Puedes detenerte cuando quieras.'],
  breathing_request: ['Si te resulta cómodo, observa una exhalación sin forzar ni contener la respiración. Si sientes mareo o incomodidad, detente y orienta tu atención a la habitación.'],
  explain_app: ['Esta aplicación ofrece controles de estimulación bilateral y herramientas opcionales de bienestar. No sustituye la psicoterapia ni la atención de un profesional cualificado en EMDR.'],
  configure_stimulation: ['Puedes cambiar los ajustes sensoriales en la aplicación: reducir la velocidad, silenciar el audio, reducir el movimiento o detenerlo por completo.'],
  session_ready: ['Antes de continuar, comprueba que te sientes cómodo y sabes dónde están los controles Pausa y Detener. Esta herramienta no sustituye la atención EMDR profesional.'],
  pause_request: ['Se reconoció la solicitud de pausa. Si la estimulación está activa, usa ahora el control Pausa. También puedes detenerla o salir de la pantalla.'],
  stop_request: ['Se reconoció la solicitud de detener. Usa el control Detener visible; este módulo no controla directamente el audio ni la animación.'],
  distress_share: ['Gracias por compartirlo. No voy a asumir qué significa. Puedes pausar la estimulación y observar el entorno. ¿Prefieres una orientación neutral al presente o hacer una pausa?'],
  positive_share: ['Gracias por compartir ese cambio. No puedo determinar su causa, pero puedes notar qué te resulta útil y decidir qué hacer después.'],
  reflection_request: ['Pregunta de reflexión suave: «¿Qué noto en el presente y qué apoyo me ayudaría ahora?» No necesitas escribir sobre recuerdos difíciles.'],
  privacy_question: ['Este módulo NLP funciona localmente y no envía el texto a un servidor. La privacidad general depende de cómo la aplicación almacene notas, registros y datos de cuenta.'],
  professional_support_request: ['Un profesional de salud mental formado en EMDR puede hablar contigo sobre si este enfoque es adecuado. La aplicación no sustituye la atención profesional.'],
  safety_concern: ['Tomo en serio tu seguridad. Puedes pausar o detener el ejercicio. Si hay peligro inmediato, contacta con los servicios de emergencia locales o con alguien de confianza.'],
  feedback: ['Gracias por los comentarios. Describe el comportamiento de la aplicación sin incluir detalles personales o clínicos.'],
  unknown: ['Puede que no te haya entendido. ¿Quieres ayuda con orientación al presente, respiración, controles, privacidad o una pregunta de reflexión?'],
};

export function getTemplate(intent: Intent, language: Language): string {
  const templates = language === 'fr' ? FR : language === 'es' ? ES : EN;
  const choices = templates[intent] ?? templates.unknown ?? EN.unknown!;
  // Deterministic choice is easier to test and doesn't make users feel that their distress is gamified.
  return choices[0] ?? EN.unknown![0];
}

export function getSafetyDisclaimer(language: Language): string {
  if (language === 'fr') return 'Outil de bien-être uniquement ; ne remplace pas les soins d’un professionnel qualifié.';
  if (language === 'es') return 'Herramienta de bienestar únicamente; no sustituye la atención de un profesional cualificado.';
  return 'Wellbeing support only; not a substitute for care from a qualified professional.';
}
