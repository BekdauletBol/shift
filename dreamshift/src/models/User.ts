import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false, // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = models.User || model('User', UserSchema);

export default User;
