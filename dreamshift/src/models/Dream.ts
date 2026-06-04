import mongoose, { Schema, model, models } from 'mongoose';
import { DreamDocument } from '@/types/dream';

const DreamSchema = new Schema<DreamDocument>({
  dream: {
    type: String,
    required: true,
  },
  result: {
    empathy: String,
    analysis: String,
    core_fear: String,
    reframe: String,
    video_prompt: String,
    breathing_exercise: String,
    sleep_technique: String,
    affirmation: String,
  },
  video_url: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Dream = models.Dream || model<DreamDocument>('Dream', DreamSchema);

export default Dream;
