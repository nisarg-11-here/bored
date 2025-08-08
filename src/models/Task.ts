import mongoose from 'mongoose';

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  aiGenerated: boolean;
  estimatedTime?: number;
}

const taskSchema = new mongoose.Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    default: 'personal',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  estimatedTime: {
    type: Number,
    default: 25,
  },
});

export default mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
