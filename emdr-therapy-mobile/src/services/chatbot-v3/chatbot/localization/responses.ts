import type { ChatIntent, ChatProfile } from '../types.ts';
import type { Language } from '../../types.ts';

type TemplateKey = ChatIntent | 'urgent_safety' | 'uncertain_safety' | 'remote_unavailable' | 'empty_input' | 'generic_fallback' | 'privacy_details' | 'not_therapy' | 'control_unavailable';

const RESPONSES: Record<'en' | 'fr' | 'es', Record<TemplateKey, string>> = {
  en: {
    greeting: "Hi. I can explain the app, offer a brief grounding or breathing exercise, or help you find a next step. I'm a wellbeing companion, not a therapist.",
    goodbye: 'Take care. You can return whenever it feels useful, and you can clear this conversation at any time.',
    app_help: 'I can help with app navigation and explain the available features. Tell me which screen or control you are trying to use. Session controls should remain visible and accessible while stimulation is active.',
    explain_emdr: 'EMDR (eye movement desensitization and reprocessing) is a psychotherapy approach delivered by trained clinicians. It may include recalling aspects of a distressing experience while using bilateral stimulation. This app can support preparation or grounding, but it cannot deliver clinician-guided EMDR or replace professional assessment.',
    grounding: 'Would you like to try a gentle grounding exercise? Look around and name five things you can see, then notice four things you can feel, three things you can hear, two things you can smell, and one thing you can taste. Skip anything uncomfortable, keep your eyes open if that feels better, and stop if the exercise makes things worse.',
    breathing: 'You could try a comfortable, unforced breath: breathe in gently, then breathe out slowly without holding your breath. Repeat only if it feels comfortable. You can stop and return to ordinary breathing at any time.',
    share_feelings: 'Thank you for telling me. I can listen and help you choose a small, present-focused next step, but I cannot determine what your feelings mean clinically. Would quiet grounding, a gentle breathing prompt, or simply putting your experience into words feel most useful?',
    reflection: 'Here is a gentle reflection prompt: “What would help me feel a little more supported in the next ten minutes?” You do not need to revisit a traumatic memory to answer. You can skip this prompt or stop at any time.',
    configure_stimulation: 'I can help you locate the stimulation settings. Please review and confirm any changes yourself. Do not increase intensity or continue if the experience feels uncomfortable, disorienting, or overwhelming.',
    pause: 'I heard a pause request. The pause control should stop the active stimulation immediately; use the dedicated control if it has not changed state.',
    stop: 'I heard a stop request. The dedicated stop control must stop stimulation independently of the chatbot. Please use it now if stimulation is still active.',
    privacy: 'This chatbot is designed for local-first use. Actual storage and network behavior depend on how the app is integrated. You should be able to review data settings, clear local conversation context, and opt out of remote processing. Do not enter identifying or highly sensitive details.',
    professional_support: 'A licensed mental-health professional trained in EMDR can explain whether the treatment fits your needs and provide the preparation, pacing, and support it requires. You can search a relevant professional registry in your region. I cannot verify a particular provider without a configured, trusted directory.',
    safety_support: 'I’m sorry this feels difficult. I cannot assess your safety from text alone. Are you in immediate danger right now, or worried you may act on thoughts of harming yourself or someone else? If you are in immediate danger, contact local emergency services or a trusted person who can be with you.',
    feedback: 'Thank you for the feedback. You can rate whether this response helped and optionally choose a category such as relevance, length, tone, or intent. Please do not include private details in feedback.',
    clarify: 'I may have misunderstood. Are you looking for help using the app, a grounding or breathing exercise, an explanation, or human support?',
    unknown: 'I’m not sure I understood. You can describe what kind of help you need in a sentence or choose one of the app’s support options. You do not need to share traumatic details.',
    urgent_safety: 'I’m concerned that you may be in immediate danger. Please contact local emergency services now, or ask a trusted person nearby to stay with you and help you get urgent support. If there is a risk of overdose or a medical emergency, seek emergency care immediately. I cannot contact services for you.',
    uncertain_safety: 'I want to check that I understood. Are you describing something happening to you now, or quoting or discussing something hypothetical? If you may be in immediate danger, contact local emergency services or a trusted person now.',
    remote_unavailable: 'I can’t reach the optional language model right now, so I’m using a local response instead. You can try again later or continue without remote processing.',
    empty_input: 'Write a message or choose a support option to continue.',
    generic_fallback: 'I can offer general app information and low-intensity grounding ideas, but I cannot diagnose, provide treatment, or replace a mental-health professional.',
    privacy_details: 'Raw chat history is not stored by this chatbot unless you explicitly enable temporary in-memory retention. If remote processing is enabled, the current message is sent to the provider; prior turns are sent only with separate history consent. The exact setup depends on how the app is integrated; check the provider policy for network and retention details.',
    not_therapy: 'I’m not a therapist and cannot provide clinical treatment or guide trauma processing. I can offer general information, present-focused grounding, and help finding professional support.',
    control_unavailable: 'I can’t verify the stimulation state from this chat. Please use the dedicated on-screen stop or pause control, which should work independently of AI responses.',
  },
  fr: {
    greeting: "Bonjour. Je peux expliquer l’application, proposer un exercice d’ancrage ou de respiration, ou aider à choisir une prochaine étape. Je suis un outil de soutien au bien-être, pas un thérapeute.",
    goodbye: 'Prenez soin de vous. Vous pouvez revenir quand cela vous sera utile et effacer ce contexte de conversation à tout moment.',
    app_help: 'Je peux vous aider à naviguer dans l’application et à comprendre ses fonctions. Dites-moi quel écran ou quel contrôle vous cherchez. Les commandes de session doivent rester accessibles pendant la stimulation.',
    explain_emdr: 'L’EMDR (désensibilisation et retraitement par les mouvements oculaires) est une approche psychothérapeutique offerte par des cliniciens formés. Elle peut associer le rappel de certains aspects d’une expérience pénible à une stimulation bilatérale. Cette application peut soutenir la préparation ou l’ancrage, mais ne remplace pas un accompagnement clinique.',
    grounding: 'Souhaitez-vous essayer un exercice d’ancrage doux ? Nommez cinq choses que vous voyez, quatre que vous pouvez sentir, trois que vous entendez, deux que vous pouvez sentir par l’odorat et une que vous pouvez goûter. Ignorez toute étape inconfortable et arrêtez si vous vous sentez moins bien.',
    breathing: 'Vous pouvez essayer une respiration confortable, sans forcer : inspirez doucement, puis expirez lentement sans retenir votre souffle. Répétez seulement si cela vous convient. Revenez à votre respiration habituelle à tout moment.',
    share_feelings: 'Merci de me l’avoir confié. Je peux vous aider à choisir une petite étape centrée sur le présent, mais je ne peux pas interpréter cliniquement vos émotions. Préférez-vous un ancrage, une suggestion de respiration ou simplement mettre des mots sur votre expérience ?',
    reflection: 'Voici une question douce : « De quoi aurais-je besoin pour me sentir un peu plus soutenu dans les dix prochaines minutes ? » Vous n’avez pas besoin de revisiter un souvenir traumatique pour y répondre.',
    configure_stimulation: 'Je peux vous aider à trouver les réglages de stimulation. Examinez et confirmez vous-même toute modification. Arrêtez si l’expérience devient inconfortable, désorientante ou accablante.',
    pause: 'J’ai compris la demande de pause. Le contrôle dédié doit interrompre immédiatement la stimulation ; utilisez-le si l’état n’a pas changé.',
    stop: 'J’ai compris la demande d’arrêt. Le contrôle d’arrêt dédié doit interrompre la stimulation indépendamment du chatbot. Utilisez-le maintenant si la stimulation continue.',
    privacy: 'Ce chatbot privilégie un fonctionnement local. Le stockage et les échanges réseau réels dépendent de l’intégration de l’application. Vous devriez pouvoir vérifier les réglages, effacer le contexte local et refuser le traitement distant.',
    professional_support: 'Un professionnel de la santé mentale formé à l’EMDR peut expliquer si cette approche convient à vos besoins et offrir le cadre nécessaire. Consultez un registre professionnel fiable de votre région. Je ne peux pas vérifier un prestataire sans annuaire de confiance configuré.',
    safety_support: 'Je suis désolé que ce soit difficile. Je ne peux pas évaluer votre sécurité uniquement à partir d’un texte. Êtes-vous en danger immédiat ou craignez-vous de vous faire du mal ou de blesser quelqu’un ? En cas de danger immédiat, contactez les services d’urgence locaux ou une personne de confiance.',
    feedback: 'Merci pour votre retour. Vous pouvez indiquer si cette réponse a aidé et sélectionner une catégorie comme la pertinence, la longueur ou le ton. N’ajoutez pas de renseignements privés.',
    clarify: 'J’ai peut-être mal compris. Cherchez-vous de l’aide pour l’application, un exercice d’ancrage ou de respiration, une explication ou un soutien humain ?',
    unknown: 'Je ne suis pas certain d’avoir compris. Décrivez en une phrase le type d’aide recherché ou choisissez une option de soutien. Vous n’avez pas besoin de partager des détails traumatiques.',
    urgent_safety: 'Je crains que vous soyez en danger immédiat. Contactez maintenant les services d’urgence locaux ou demandez à une personne de confiance de rester avec vous et de vous aider à obtenir du soutien urgent. Je ne peux pas contacter les services à votre place.',
    uncertain_safety: 'Je veux vérifier que j’ai compris. Décrivez-vous une situation qui vous arrive maintenant, ou citez-vous un propos ou un scénario hypothétique ? En cas de danger immédiat, contactez les services d’urgence locaux.',
    remote_unavailable: 'Le modèle de langage facultatif est inaccessible ; j’utilise donc une réponse locale. Vous pouvez réessayer plus tard ou continuer sans traitement distant.',
    empty_input: 'Écrivez un message ou choisissez une option de soutien pour continuer.',
    generic_fallback: 'Je peux donner des informations générales sur l’application et proposer un ancrage doux, mais je ne peux pas établir de diagnostic ni remplacer un professionnel.',
    privacy_details: 'L’historique brut n’est pas conservé par ce chatbot sauf activation explicite d’une mémoire temporaire en mémoire vive. Le traitement distant transmet le message actuel au fournisseur ; l’historique nécessite un consentement distinct.',
    not_therapy: 'Je ne suis pas thérapeute et ne peux pas fournir de traitement clinique ni guider un travail sur un traumatisme. Je peux proposer des informations générales, un ancrage dans le présent et de l’aide pour trouver un professionnel.',
    control_unavailable: 'Je ne peux pas vérifier l’état de la stimulation depuis cette conversation. Utilisez le contrôle dédié de pause ou d’arrêt, qui doit fonctionner indépendamment de l’IA.',
  },
  es: {
    greeting: 'Hola. Puedo explicar la aplicación, ofrecer un ejercicio breve de conexión con el presente o respiración, o ayudarte a elegir el siguiente paso. Soy una herramienta de bienestar, no un terapeuta.',
    goodbye: 'Cuídate. Puedes volver cuando te resulte útil y borrar el contexto de esta conversación en cualquier momento.',
    app_help: 'Puedo ayudarte a navegar por la aplicación y entender sus funciones. Dime qué pantalla o control buscas. Los controles de la sesión deben seguir accesibles durante la estimulación.',
    explain_emdr: 'EMDR (desensibilización y reprocesamiento por movimientos oculares) es un enfoque de psicoterapia que ofrecen profesionales formados. Puede combinar el recuerdo de aspectos de una experiencia difícil con estimulación bilateral. Esta aplicación puede apoyar la preparación o la conexión con el presente, pero no sustituye la atención clínica.',
    grounding: '¿Quieres probar un ejercicio suave? Nombra cinco cosas que ves, cuatro que sientes con el tacto, tres que oyes, dos que hueles y una que saboreas. Omite cualquier paso incómodo y detente si te hace sentir peor.',
    breathing: 'Puedes probar una respiración cómoda y sin forzar: inspira suavemente y exhala despacio, sin contener la respiración. Repite solo si te resulta agradable. Puedes volver a tu respiración habitual en cualquier momento.',
    share_feelings: 'Gracias por contármelo. Puedo ayudarte a elegir un pequeño paso centrado en el presente, pero no puedo interpretar clínicamente tus emociones. ¿Prefieres un ejercicio de conexión con el presente, una sugerencia de respiración o poner en palabras lo que sientes?',
    reflection: 'Aquí tienes una pregunta amable: «¿Qué me ayudaría a sentirme un poco más acompañado durante los próximos diez minutos?». No necesitas volver a un recuerdo traumático para responder.',
    configure_stimulation: 'Puedo ayudarte a localizar los ajustes de estimulación. Revisa y confirma tú cualquier cambio. Detente si la experiencia resulta incómoda, desorientadora o abrumadora.',
    pause: 'He entendido la petición de pausa. El control específico debe detener la estimulación inmediatamente; úsalo si el estado no ha cambiado.',
    stop: 'He entendido la petición de detener. El control específico debe detener la estimulación independientemente del chatbot. Úsalo ahora si la estimulación continúa.',
    privacy: 'Este chatbot está diseñado para priorizar el uso local. El almacenamiento y el tráfico de red reales dependen de la integración. Deberías poder revisar los ajustes, borrar el contexto local y desactivar el procesamiento remoto.',
    professional_support: 'Un profesional de salud mental con formación en EMDR puede explicar si este enfoque se ajusta a tus necesidades y ofrecer el apoyo necesario. Consulta un registro profesional fiable de tu región. No puedo verificar a un proveedor sin un directorio de confianza configurado.',
    safety_support: 'Siento que estés pasando por algo difícil. No puedo evaluar tu seguridad solo mediante texto. ¿Estás en peligro inmediato o temes hacerte daño o hacérselo a alguien? Si hay peligro inmediato, contacta con los servicios de emergencia locales o con una persona de confianza.',
    feedback: 'Gracias por tus comentarios. Puedes indicar si la respuesta ayudó y elegir una categoría, como relevancia, extensión o tono. No incluyas datos privados.',
    clarify: 'Puede que te haya entendido mal. ¿Buscas ayuda con la aplicación, un ejercicio de conexión con el presente o respiración, una explicación o apoyo humano?',
    unknown: 'No estoy seguro de haber entendido. Describe en una frase qué tipo de ayuda necesitas o elige una opción de apoyo. No necesitas compartir detalles traumáticos.',
    urgent_safety: 'Me preocupa que puedas estar en peligro inmediato. Contacta ahora con los servicios de emergencia locales o pide a una persona de confianza que se quede contigo y te ayude a buscar apoyo urgente. No puedo contactar con los servicios por ti.',
    uncertain_safety: 'Quiero comprobar que entendí. ¿Describes algo que te ocurre ahora o citas una frase o situación hipotética? Si hay peligro inmediato, contacta con los servicios de emergencia locales.',
    remote_unavailable: 'No puedo acceder al modelo de lenguaje opcional ahora, así que usaré una respuesta local. Puedes intentarlo más tarde o continuar sin procesamiento remoto.',
    empty_input: 'Escribe un mensaje o elige una opción de apoyo para continuar.',
    generic_fallback: 'Puedo ofrecer información general sobre la aplicación y ejercicios suaves de conexión con el presente, pero no diagnosticar ni sustituir a un profesional.',
    privacy_details: 'El chatbot no guarda el historial de texto salvo que actives explícitamente la retención temporal en memoria. El procesamiento remoto envía el mensaje actual al proveedor; enviar turnos anteriores requiere otro consentimiento.',
    not_therapy: 'No soy terapeuta y no puedo ofrecer tratamiento clínico ni guiar el procesamiento de trauma. Puedo dar información general, ejercicios centrados en el presente y ayuda para encontrar atención profesional.',
    control_unavailable: 'No puedo comprobar el estado de la estimulación desde este chat. Usa el control específico de pausa o parada, que debe funcionar independientemente de la IA.',
  },
};

export function getChatResponse(key: TemplateKey, language: Language, profile?: ChatProfile): string {
  const locale = language === 'fr' || language === 'es' ? language : 'en';
  let result = RESPONSES[locale][key] ?? RESPONSES[locale].generic_fallback;
  if (profile?.tone === 'direct') result = shortenFirstParagraph(result);
  if (profile?.responseLength === 'brief') result = shortenFirstParagraph(result);
  if (profile?.responseLength === 'detailed' && key === 'explain_emdr') {
    const addition = locale === 'fr'
      ? ' Le rythme, le choix des cibles et la stabilisation sont individualisés par le clinicien. Ne tentez pas de retraiter seul un souvenir traumatique avec cette application.'
      : locale === 'es'
        ? ' El ritmo, los objetivos y la estabilización se adaptan con el profesional. No intentes reprocesar recuerdos traumáticos por tu cuenta con esta aplicación.'
        : ' The clinician individualizes pacing, targets, and stabilization. Do not attempt to reprocess traumatic memories on your own with this app.';
    result += addition;
  }
  return result;
}

export function supportedChatLanguages(): Array<'en' | 'fr' | 'es'> { return ['en', 'fr', 'es']; }

function shortenFirstParagraph(value: string): string {
  const first = value.split(/(?<=[.!?])\s+/u)[0];
  return first || value;
}
