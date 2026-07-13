import axios from 'axios';

const DKT_ENGINE_URL = process.env.DKT_ENGINE_URL || 'http://127.0.0.1:8000';

/**
 * Get personalized learning roadmap and mastery probability from the DKT PyTorch model
 * 
 * @param {Array} interactions - Quiz interactions list: [{ is_correct, time_taken, attempt_count, hint_count }]
 * @returns {Promise<object>} - PyTorch LSTM prediction results (mastery_probability, recommendation, learning_path, etc.)
 */
export const getPrediction = async (interactions) => {
  try {
    console.log(`📡 Sending ${interactions.length} interactions to DKT PyTorch Model at ${DKT_ENGINE_URL}...`);
    const response = await axios.post(`${DKT_ENGINE_URL}/predict`, {
      interactions
    });
    
    if (response.data) {
      return response.data;
    }
    throw new Error('Invalid response received from DKT engine');
  } catch (error) {
    console.error('❌ DKT Engine API failed:', error.message);
    throw new Error(error.response?.data?.detail || error.message || 'Failed to communicate with DKT Engine');
  }
};
