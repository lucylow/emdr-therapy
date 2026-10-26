import type { Intent } from '../types.ts';
import type { TrainingExample } from './naive-bayes.ts';

/**
 * Synthetic, hand-authored routing examples. They contain no user conversations.
 * Review and expand this corpus against consent-free examples before product release.
 */
const CORPUS: Record<Exclude<Intent, 'unknown'>, string[]> = {
  greeting: [
    'hello there', 'hi', 'hey there', 'good morning to you', 'good evening', 'hello assistant', 'hi can you help',
    'bonjour comment allez vous', 'salut', 'bonsoir', 'hola buenos días', 'hola que tal', 'buenas tardes',
    'hello again', 'hey how are you', 'good afternoon', 'just saying hello', 'hi app', 'hello there please', 'greetings',
  ],
  goodbye: [
    'goodbye for now', 'see you later', 'I will come back later', 'thanks that is all', 'I am leaving now', 'end conversation',
    'au revoir', 'à plus tard', 'je reviendrai plus tard', 'adiós por ahora', 'hasta mañana', 'me voy ahora',
    'I have finished chatting', 'we can stop talking', 'I do not need anything else', 'that is enough for today',
    'I am closing the app', 'talk another time', 'finish this conversation', 'thank you bye',
  ],
  grounding_request: [
    'can you guide grounding', 'help me orient to the room', 'I want a present moment exercise', 'what can I see around me',
    'help me reconnect with the room', 'I feel far away from the present', 'show a grounding activity', 'help me notice my surroundings',
    'please give me a sensory orientation exercise', 'I want to look around and feel present', 'aide moi à revenir au présent',
    'je voudrais un exercice neutre', 'necesito volver al presente', 'ayúdame a orientarme en la habitación',
    'can we do a five things exercise', 'help me feel anchored right now', 'give me a gentle grounding prompt',
    'I want an exercise using nearby objects', 'I need to orient to where I am', 'help me notice the chair beneath me',
  ],
  breathing_request: [
    'could you guide breathing', 'give me a slow breathing prompt', 'I want to notice my breathing', 'help me take a comfortable breath',
    'please lead a short breath exercise', 'I would like breathing guidance', 'can we try a breathing technique', 'show me a breath practice',
    'I want to focus on one exhale', 'guide me through natural breathing', 'aide moi à respirer doucement', 'je veux un exercice respiratoire',
    'necesito una guía de respiración', 'quiero observar mi respiración', 'help with breathing please', 'breathing support now',
    'can you help me slow down gently', 'I want a short breathing moment', 'tell me how to notice an exhale', 'do a breathing exercise',
  ],
  explain_app: [
    'tell me the purpose of this app', 'what can I do here', 'explain the main features', 'how should I navigate the app',
    'what does bilateral stimulation mean', 'can you explain the controls', 'what is this tool for', 'give me an overview of this app',
    'what are the limitations of this application', 'how can I use the wellbeing tools', 'explique les fonctions principales',
    'à quoi sert cette application', 'explica para qué sirve esta aplicación', 'cuáles son las funciones',
    'is this a therapist', 'can this app provide therapy', 'what does the session button do', 'where can I find settings',
    'tell me about the available exercises', 'what is the app designed to support',
  ],
  configure_stimulation: [
    'lower the movement speed', 'increase the speed a little', 'I want slower animation', 'mute the bilateral sound',
    'can I turn audio off', 'show the stimulation preferences', 'make the dot smaller', 'change the background color',
    'I prefer no animation', 'where are sensory settings', 'ralentis le mouvement', 'je voudrais couper le son',
    'cambia la velocidad del movimiento', 'quiero reducir la animación', 'turn the sound down', 'reduce visual intensity',
    'use a slower pace', 'enable reduced motion', 'I need to change the stimulation options', 'can I configure visual movement',
  ],
  session_ready: [
    'I feel ready to begin', 'start the session flow', 'I would like to begin now', 'let us start', 'begin the guided exercise',
    'open the session', 'I am ready to continue', 'I want to get started', 'commençons la séance', 'je suis prêt à commencer',
    'quiero empezar ahora', 'estoy preparado para comenzar', 'ready for the next step', 'begin when ready', 'start a new session',
    'can we start now', 'I am comfortable starting', 'proceed to session setup', 'begin the activity', 'start the exercise flow',
  ],
  pause_request: [
    'please pause for a minute', 'I would like a pause', 'hold the session', 'freeze the current movement', 'wait before continuing',
    'give me a short break', 'pause the animation', 'pause the sound and movement', 'I need a moment', 'let me pause',
    'mets en pause s il te plaît', 'je veux faire une pause', 'necesito una pausa', 'pausa por un momento',
    'can you pause this now', 'hold on please', 'stop for a second so I can rest', 'pause before I continue',
    'I want to take a break', 'pause the exercise temporarily',
  ],
  stop_request: [
    'stop the exercise immediately', 'I want to end this session', 'turn off stimulation', 'close the active activity', 'cancel this session now',
    'stop the animation and audio', 'end this activity', 'I do not want to continue this exercise', 'please stop everything', 'stop playback now',
    'arrête la séance', 'je veux tout arrêter', 'detén el ejercicio', 'quiero terminar esta actividad', 'shut the stimulation off',
    'stop the current session please', 'I am ending the session', 'exit the active session', 'stop this right away', 'switch everything off',
  ],
  distress_share: [
    'I am finding this difficult', 'I feel nervous right now', 'this feels like too much', 'I feel unsettled', 'I am worried and tense',
    'I feel scared about what I am feeling', 'I am having a hard moment', 'I feel emotionally overloaded', 'I feel uncomfortable continuing',
    'I am struggling to stay present', 'je me sens dépassé', 'je me sens inquiet', 'esto me resulta demasiado', 'me siento muy nervioso',
    'I am not feeling okay', 'I feel tense and frightened', 'I am stressed at the moment', 'I feel stuck', 'I am having a difficult time',
    'I do not feel comfortable with this',
  ],
  positive_share: [
    'I notice that I am calmer', 'I feel a little more settled', 'this was useful for me', 'I feel some relief', 'I am feeling okay now',
    'I feel more hopeful', 'that was a helpful pause', 'I notice some improvement in comfort', 'I feel less tense', 'I feel more grounded',
    'je me sens plus calme', 'je me sens mieux maintenant', 'me siento más tranquilo', 'me encuentro un poco mejor',
    'I am glad I tried this', 'I feel encouraged', 'I feel peaceful in this moment', 'that felt manageable', 'I feel more steady', 'I feel relieved',
  ],
  reflection_request: [
    'offer a journal question', 'give me a gentle reflection prompt', 'help me write down what I notice', 'I want to reflect on the present',
    'suggest a journaling topic', 'give me a sentence starter', 'help me name what is useful now', 'can you give me a short journal prompt',
    'I want to write about what I need today', 'help me describe my current surroundings', 'propose une question de réflexion',
    'aide moi à trouver des mots', 'dame una pregunta para reflexionar', 'quiero escribir sobre lo que necesito',
    'what is a neutral question I can journal about', 'help me start a reflection', 'give me something to write about without details',
    'suggest an optional check in prompt', 'help me capture one observation', 'ask me a gentle present focused question',
  ],
  privacy_question: [
    'does this stay on my phone', 'is my journal sent to a server', 'what information is collected', 'how do I delete records',
    'do you save what I type', 'is my text used for training', 'where is my information processed', 'can I use this offline',
    'does the AI upload my message', 'what does local processing mean', 'mes données restent elles sur mon téléphone',
    'comment supprimer mes données', 'se guarda mi información en línea', 'cómo se elimina mi historial',
    'does this app have analytics', 'can I disable remote processing', 'is my conversation stored', 'who can see my notes',
    'what happens to the text I enter', 'can I opt out of cloud AI',
  ],
  professional_support_request: [
    'how do I find a qualified EMDR clinician', 'I want to speak with a therapist', 'where can I seek professional support',
    'can I ask a clinician about this', 'find a mental health professional', 'I would like to contact a counsellor',
    'what kind of professional can guide EMDR', 'I need information about getting clinical care', 'help me look for a therapist',
    'I want a human support option', 'comment trouver un thérapeute qualifié', 'je voudrais parler à un professionnel',
    'quiero encontrar un terapeuta cualificado', 'necesito hablar con un profesional de salud mental',
    'how can I discuss this with a clinician', 'I prefer support from a qualified person', 'can you suggest seeking professional care',
    'I want a therapist who understands EMDR', 'I would like human guidance', 'help me prepare to speak to a clinician',
  ],
  safety_concern: [
    'I might do something to hurt myself', 'I am worried I will not stay safe', 'I have thoughts about ending my life',
    'I am scared of what I might do', 'I may hurt somebody soon', 'I do not feel safe with myself',
    'I am thinking about self harm', 'I feel in immediate danger', 'I took too many pills', 'I cannot breathe properly',
    'je pense à me faire du mal', 'je ne me sens pas en sécurité', 'pienso en hacerme daño', 'no me siento a salvo',
    'I am afraid I may lose control and hurt someone', 'I need help staying safe', 'I may act on these thoughts',
    'I am afraid I could hurt myself tonight', 'someone is threatening me right now', 'I need urgent help to stay safe',
  ],
  feedback: [
    'I found an error in the app', 'the button does not work', 'the app keeps freezing', 'I have a feature suggestion',
    'I want to report a usability issue', 'this instruction is confusing', 'the layout is hard to read', 'I found a spelling mistake',
    'the sound does not stop', 'there is a problem with the settings', 'j ai trouvé un problème', 'hay un error en la aplicación',
    'help me report a bug', 'I want to suggest an improvement', 'something is not responding', 'the navigation is confusing',
    'I want to leave product feedback', 'the screen does not fit my phone', 'I have a technical issue', 'the app behaves unexpectedly',
  ],
};

export const EXPANDED_TRAINING_CORPUS: TrainingExample[] = Object.entries(CORPUS).flatMap(([label, texts]) =>
  texts.map((text) => ({ label: label as Intent, text })),
);
