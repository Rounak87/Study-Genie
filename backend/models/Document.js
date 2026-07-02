import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  r2Key: {
    type: String,
    required: true
  },
  textContent: {
    type: String,
    default: ''
  },
  textExtractionMethod: {
    type: String,
    default: 'none'
  },
  summaries: {
    type: Map,
    of: String,
    default: {}
  },
  studyMaterials: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);
