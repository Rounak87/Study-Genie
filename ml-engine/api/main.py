import os
import sys
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
from typing import List

# ── Add parent directory so we can import the model class ──
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))


# ──────────────────────────────────────────────
# Re-define the same LSTM model architecture
# (Must match exactly what was used during training)
# ──────────────────────────────────────────────

class DKTModel(nn.Module):
    def __init__(self, input_size=4, hidden_size=64, num_layers=2, dropout=0.2):
        super(DKTModel, self).__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True
        )
        self.fc = nn.Linear(hidden_size, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        prediction = self.fc(lstm_out)
        prediction = self.sigmoid(prediction).squeeze(-1)
        return prediction


# ──────────────────────────────────────────────
# Load the trained model into memory
# ──────────────────────────────────────────────

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "dkt_model.pt")

model = DKTModel(input_size=4, hidden_size=64, num_layers=2)

if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu", weights_only=True))
    model.eval()
    print("[SUCCESS] DKT Model loaded successfully!")
else:
    print("[WARNING] Model file not found! Run train_model.py first.")
    print(f"   Expected path: {MODEL_PATH}")


# ──────────────────────────────────────────────
# FastAPI App Setup
# ──────────────────────────────────────────────

app = FastAPI(
    title="StudyGenie ML Engine",
    description="Deep Knowledge Tracing API for personalized learning paths",
    version="1.0.0"
)

# Allow requests from any frontend (React, HTML demo, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Request / Response Models
# ──────────────────────────────────────────────

class Interaction(BaseModel):
    """One quiz question attempt by the student."""
    is_correct: int        # 1 = right, 0 = wrong
    time_taken: float      # seconds (will be normalized)
    attempt_count: int     # number of tries (1-3)
    hint_count: int        # hints used (0-3)

class PredictRequest(BaseModel):
    """The full quiz session sent from the frontend."""
    interactions: List[Interaction]

class PathStep(BaseModel):
    """One step in the recommended learning path."""
    step: int
    action: str
    description: str
    icon: str

class PredictResponse(BaseModel):
    """What the API sends back to the frontend."""
    mastery_probability: float
    recommendation: str
    detail: str
    suggested_difficulty: str
    learning_path: List[PathStep]


# ──────────────────────────────────────────────
# The Prediction Endpoint
# ──────────────────────────────────────────────

@app.post("/predict", response_model=PredictResponse)
async def predict_learning_path(request: PredictRequest):
    """
    Takes a student's quiz interactions and returns
    a personalized learning path recommendation.
    """
    
    # --- Convert interactions to model input ---
    seq_length = 19  # Model expects sequences of this length (20 - 1)
    features = []
    
    for interaction in request.interactions:
        # Normalize time_taken to 0-1 range (cap at 60 seconds)
        normalized_time = min(interaction.time_taken / 60.0, 1.0)
        
        features.append([
            float(interaction.is_correct),
            normalized_time,
            float(interaction.attempt_count) / 3.0,  # Normalize to 0-1
            float(interaction.hint_count) / 3.0,      # Normalize to 0-1
        ])
    
    # Pad or truncate to fixed sequence length
    if len(features) >= seq_length:
        features = features[:seq_length]
    else:
        padding = [[0.0, 0.0, 0.0, 0.0]] * (seq_length - len(features))
        features = padding + features
    
    # --- Run through LSTM model ---
    input_tensor = torch.tensor([features], dtype=torch.float32)
    
    with torch.no_grad():
        prediction = model(input_tensor)
    
    # The last prediction in the sequence = probability for next question
    raw_lstm_prob = float(prediction[0, -1])
    
    # --- Also calculate simple stats for richer recommendations ---
    total_correct = sum(i.is_correct for i in request.interactions)
    total_questions = len(request.interactions)
    accuracy = total_correct / total_questions if total_questions > 0 else 0
    avg_time = sum(i.time_taken for i in request.interactions) / total_questions if total_questions > 0 else 0
    
    # --- Blend LSTM prediction with actual accuracy ---
    # 40% weight on LSTM behavioral prediction, 60% on raw accuracy
    # Accuracy is the primary signal; LSTM adds behavioral nuance
    mastery_prob = (raw_lstm_prob * 0.4) + (accuracy * 0.6)
    
    # Hard cap: if accuracy is terrible, cap mastery regardless of LSTM
    # A student who gets 1/5 or 2/5 should NEVER see "advance"
    if accuracy < 0.4:
        mastery_prob = min(mastery_prob, 0.40)
    elif accuracy < 0.6:
        mastery_prob = min(mastery_prob, 0.60)
    
    # --- Decision Logic: Convert probability to recommendation ---
    if mastery_prob >= 0.70:
        recommendation = "advance"
        detail = f"Strong performance detected! You answered {total_correct}/{total_questions} correctly with an average time of {avg_time:.1f}s. You're ready for harder material."
        suggested_difficulty = "hard"
        learning_path = [
            PathStep(step=1, action="🏆 Challenge Mode", description="Attempt advanced-level questions to push your limits", icon="trophy"),
            PathStep(step=2, action="📖 Deep Dive Reading", description="Explore complex subtopics and edge cases in the material", icon="book"),
            PathStep(step=3, action="🎯 Mastery Quiz", description="Take a final hard quiz to confirm full understanding", icon="target"),
        ]
    elif mastery_prob >= 0.45:
        recommendation = "practice_more"
        detail = f"Decent progress! You got {total_correct}/{total_questions} correct (avg {avg_time:.1f}s/question). Some concepts need more practice before moving on."
        suggested_difficulty = "medium"
        learning_path = [
            PathStep(step=1, action="📝 Review Key Concepts", description="Re-read the summary focusing on areas you got wrong", icon="notes"),
            PathStep(step=2, action="🔄 Practice Quiz", description="Retake a medium-difficulty quiz on the same topics", icon="refresh"),
            PathStep(step=3, action="💡 Flashcard Drill", description="Use flashcards to reinforce weak areas before advancing", icon="lightbulb"),
            PathStep(step=4, action="📈 Progress Check", description="Take another quiz to see if mastery improved", icon="chart"),
        ]
    else:
        recommendation = "review_fundamentals"
        detail = f"You scored {total_correct}/{total_questions} (avg {avg_time:.1f}s/question). The model detects knowledge gaps. Let's revisit the basics before continuing."
        suggested_difficulty = "easy"
        learning_path = [
            PathStep(step=1, action="📚 Revisit Fundamentals", description="Go back to the study notes and read them carefully", icon="book"),
            PathStep(step=2, action="🃏 Basic Flashcards", description="Practice with basic flashcards to build core understanding", icon="cards"),
            PathStep(step=3, action="✅ Easy Quiz", description="Take a simplified quiz to build confidence", icon="check"),
            PathStep(step=4, action="🔁 Re-attempt Original", description="Try the original quiz again after reviewing", icon="retry"),
            PathStep(step=5, action="📊 Compare Progress", description="Check if your scores improved from the first attempt", icon="chart"),
        ]
    
    return PredictResponse(
        mastery_probability=round(mastery_prob, 4),
        recommendation=recommendation,
        detail=detail,
        suggested_difficulty=suggested_difficulty,
        learning_path=learning_path,
    )


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────

@app.get("/")
async def health_check():
    model_loaded = os.path.exists(MODEL_PATH)
    return {
        "status": "running",
        "model_loaded": model_loaded,
        "message": "StudyGenie ML Engine is active!"
    }
