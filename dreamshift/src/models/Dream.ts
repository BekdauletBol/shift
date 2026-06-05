import mongoose, { Schema, model, models } from 'mongoose';
import { DreamDocument } from '@/types/dream';

const DreamSchema = new Schema<DreamDocument>({
  userId: {
    type: String,
    index: true,
  },
  dream: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    enum: ['en', 'ru', 'kk'],
    default: 'en',
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
    map_coords: {
      lucidity: Number,
      intensity: Number,
    },
  },
  video_url: String,
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Dream = models.Dream || model<DreamDocument>('Dream', DreamSchema);

export default Dream;
