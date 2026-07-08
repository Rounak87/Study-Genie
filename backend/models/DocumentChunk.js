import mongoose from 'mongoose';

const DocumentChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  chunkIndex: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Optional: Add index for compound queries
DocumentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

export default mongoose.model('DocumentChunk', DocumentChunkSchema);
