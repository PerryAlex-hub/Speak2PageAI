// Available writing tones for users to choose
export const WRITING_TONES = [
  {
    id: "professional",
    name: "Professional",
    description:
      "Clear, authoritative, and polished. Perfect for business topics, industry insights, and thought leadership pieces.",
  },
  {
    id: "conversational",
    name: "Conversational",
    description:
      "Friendly and approachable. Like chatting with a knowledgeable friend over coffee. Uses casual language and relatable examples.",
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description:
      "Narrative-driven and engaging. Weaves information into compelling stories. Uses vivid descriptions and emotional hooks.",
  },
  {
    id: "educational",
    name: "Educational",
    description:
      "Clear explanations with a teaching focus. Breaks down complex topics step by step. Great for tutorials and how-to content.",
  },
  {
    id: "persuasive",
    name: "Persuasive",
    description:
      "Compelling and action-oriented. Builds strong arguments with evidence. Designed to convince and motivate readers.",
  },
  {
    id: "witty",
    name: "Witty & Engaging",
    description:
      "Sharp, clever, and entertaining. Uses humor and wordplay while delivering valuable insights. Never boring.",
  },
] as const;

export type WritingTone = (typeof WRITING_TONES)[number]["id"];

// Available word count options
export const WORD_COUNT_OPTIONS = [
  { id: "short", name: "Short (~500 words)", words: 500 },
  { id: "medium", name: "Medium (~900 words)", words: 900 },
  { id: "long", name: "Long (~1500 words)", words: 1500 },
] as const;

export type WordCountOption = (typeof WORD_COUNT_OPTIONS)[number]["id"];
