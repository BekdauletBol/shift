export interface DreamAnalysisResponse {
  empathy: string;
  analysis: string;
  core_fear: string;
  reframe: string;
  video_prompt: string;
  breathing_exercise: string;
  sleep_technique: string;
  affirmation: string;
}

export interface DreamDocument {
  _id?: string;
  dream: string;
  result: DreamAnalysisResponse;
  createdAt: Date;
}
