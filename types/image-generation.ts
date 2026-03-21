export type ImageStyleOption = {
  id: string;
  label: string;
  emoji: string;
  image?: string;
};



export type ImagePromptFormValues = {
  extraContext: string;
  characterInput: string;
  characters: { name: string }[];
  includePostTitle: string;
};

export type ImageGenerationRequest = {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "low" | "medium" | "high" | "auto";
};

export type ImageGenerationResponse = {
  imageUrl: string;
  prompt: string;
};
