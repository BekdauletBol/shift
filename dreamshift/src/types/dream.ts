export type Language = 'en' | 'ru' | 'kk';

export interface DreamAnalysisResponse {
  empathy: string;
  analysis: string;
  core_fear: string;
  reframe: string;
  video_prompt: string;
  breathing_exercise: string;
  sleep_technique: string;
  affirmation: string;
  map_coords?: {
    lucidity: number; // 0-100
    intensity: number; // 0-100
  };
}

export interface DreamDocument {
  _id?: string;
  userId?: string;
  dream: string;
  language: Language;
  result: DreamAnalysisResponse;
  video_url?: string;
  isPublic?: boolean;
  createdAt: Date;
}
