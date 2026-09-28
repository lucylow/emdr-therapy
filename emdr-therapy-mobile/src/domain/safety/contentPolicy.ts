const diagnosticPhrases = [
  "diagnose",
  "diagnosis",
  "you have ptsd",
  "you have depression",
  "you have anxiety disorder",
  "clinical certainty",
];

export function containsDiagnosticLanguage(text: string) {
  const value = text.toLowerCase();
  return diagnosticPhrases.some((phrase) => value.includes(phrase));
}

export function sanitizeAiReflection(text: string) {
  if (containsDiagnosticLanguage(text))
    return "This reflection has been simplified to descriptive language and is not a diagnosis or medical assessment.";
  return text.trim().slice(0, 600);
}
