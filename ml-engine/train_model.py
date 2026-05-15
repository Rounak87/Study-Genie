
import os
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split

# ──────────────────────────────────────────────
# STEP 1:Student Quiz Data
# ──────────────────────────────────────────────

def generate_synthetic_data(num_students=500, max_interactions=30):
   
    print(" student data...")
    
    all_data = []
    
    for student_id in range(num_students):
        
        student_type = np.random.choice(
            ["strong", "average", "weak"], 
            p=[0.3, 0.4, 0.3]  
        )
        
        num_interactions = np.random.randint(10, max_interactions + 1)
        
        for i in range(num_interactions):
            if student_type == "strong":
                # Strong students: high accuracy, fast, few hints
                is_correct = np.random.choice([1, 0], p=[0.85, 0.15])
                time_taken = np.random.uniform(0.05, 0.35)  # Fast
                attempt_count = np.random.choice([1, 1, 1, 2])  # Mostly first try
                hint_count = np.random.choice([0, 0, 0, 1])  # Rarely use hints
                
            elif student_type == "weak":
                # Weak students: low accuracy, slow, many hints
                is_correct = np.random.choice([1, 0], p=[0.25, 0.75])
                time_taken = np.random.uniform(0.5, 1.0)  # Slow
                attempt_count = np.random.choice([1, 2, 2, 3])  # Multiple tries
                hint_count = np.random.choice([0, 1, 2, 3])  # Use hints often
                
            else:
                # Average students: middle ground
                is_correct = np.random.choice([1, 0], p=[0.55, 0.45])
                time_taken = np.random.uniform(0.2, 0.7)  # Medium
                attempt_count = np.random.choice([1, 1, 2, 2])
                hint_count = np.random.choice([0, 0, 1, 2])
            
            all_data.append({
                "student_id": student_id,
                "interaction_order": i,
                "is_correct": is_correct,
                "time_taken": round(time_taken, 3),
                "attempt_count": attempt_count,
                "hint_count": hint_count,
            })
    
    df = pd.DataFrame(all_data)
    
    # Save to CSV for reference
    data_path = os.path.join(os.path.dirname(__file__), "data", "student_interactions.csv")
    df.to_csv(data_path, index=False)
    print(f"✅ Generated {len(df)} interactions from {num_students} students")
    print(f"   Saved to: {data_path}")
    
    return df


# ──────────────────────────────────────────────
# STEP 2: Prepare Data for LSTM
# ──────────────────────────────────────────────

class StudentSequenceDataset(Dataset):
    """
    Converts raw student interactions into sequences for the LSTM.
    
    Each student becomes one sequence:
      Input (X):  interactions 1 to N-1
      Target (y): is_correct for interactions 2 to N
    
    The LSTM sees past behavior and predicts future success.
    """
    
    def __init__(self, dataframe, seq_length=20):
        self.sequences = []
        self.targets = []
        self.seq_length = seq_length
        
        feature_cols = ["is_correct", "time_taken", "attempt_count", "hint_count"]
        
        
        for student_id, group in dataframe.groupby("student_id"):
            group = group.sort_values("interaction_order")
            features = group[feature_cols].values
            
            
            if len(features) < 5:
                continue
            
            
            if len(features) >= seq_length:
                features = features[:seq_length]
            else:
                padding = np.zeros((seq_length - len(features), len(feature_cols)))
                features = np.vstack([padding, features])
            
          
            self.sequences.append(features[:-1].astype(np.float32))
            self.targets.append(features[1:, 0].astype(np.float32))  # is_correct column
    
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        return (
            torch.tensor(self.sequences[idx]),
            torch.tensor(self.targets[idx])
        )


─────────────────────────────────────────────

class DKTModel(nn.Module):
    """
    Deep Knowledge Tracing Model using LSTM.
    
    Architecture:
      Input (4 features) → LSTM (64 hidden units, 2 layers)
      → Fully Connected (64 → 1) → Sigmoid
    
    Output: A probability between 0 and 1
      - Close to 1 = student will likely get next question right
      - Close to 0 = student will likely get it wrong
    """
    
    def __init__(self, input_size=4, hidden_size=64, num_layers=2, dropout=0.2):
        super(DKTModel, self).__init__()
        
        self.lstm = nn.LSTM(
            input_size=input_size,    # 4 behavioral features
            hidden_size=hidden_size,  # 64 neurons inside LSTM
            num_layers=num_layers,    # 2 stacked LSTM layers
            dropout=dropout,          # Prevent overfitting
            batch_first=True          # Input shape: (batch, sequence, features)
        )
        
        self.fc = nn.Linear(hidden_size, 1)  # Compress 64 values to 1 prediction
        self.sigmoid = nn.Sigmoid()           # Output between 0 and 1
    
    def forward(self, x):
        # x shape: (batch_size, sequence_length, 4)
        lstm_out, _ = self.lstm(x)
        # lstm_out shape: (batch_size, sequence_length, 64)
        
        prediction = self.fc(lstm_out)
        # prediction shape: (batch_size, sequence_length, 1)
        
        prediction = self.sigmoid(prediction).squeeze(-1)
        # prediction shape: (batch_size, sequence_length)
        
        return prediction


─────────────────────────────────────────────

def train_model():
    print("\n" + "="*50)
    print("  DKT Model Training Pipeline")
    print("="*50)
    
    # --- Generate Data ---
    df = generate_synthetic_data(num_students=500, max_interactions=30)
    
    # --- Create Datasets ---
    print("\n📦 Preparing sequences for LSTM...")
    dataset = StudentSequenceDataset(df, seq_length=20)
    
    # Split: 80% train, 20% test
    train_size = int(0.8 * len(dataset))
    test_size = len(dataset) - train_size
    train_dataset, test_dataset = torch.utils.data.random_split(dataset, [train_size, test_size])
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=32)
    
    print(f"   Train sequences: {train_size}")
    print(f"   Test sequences:  {test_size}")
    
    # --- Initialize Model ---
    model = DKTModel(input_size=4, hidden_size=64, num_layers=2)
    criterion = nn.BCELoss()           # Binary Cross-Entropy Loss
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    print(f"\n🧠 Model Architecture:")
    print(f"   LSTM: 4 inputs → 64 hidden × 2 layers → 1 output")
    print(f"   Total parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # --- Training Loop ---
    num_epochs = 30
    best_test_acc = 0
    
    print(f"\n🚀 Training for {num_epochs} epochs...\n")
    
    for epoch in range(num_epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for X_batch, y_batch in train_loader:
            optimizer.zero_grad()
            predictions = model(X_batch)
            loss = criterion(predictions, y_batch)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            # Calculate accuracy
            predicted_labels = (predictions > 0.5).float()
            correct += (predicted_labels == y_batch).sum().item()
            total += y_batch.numel()
        
        train_acc = correct / total * 100
        avg_loss = total_loss / len(train_loader)
        
        # --- Evaluate on Test Set ---
        model.eval()
        test_correct = 0
        test_total = 0
        
        with torch.no_grad():
            for X_batch, y_batch in test_loader:
                predictions = model(X_batch)
                predicted_labels = (predictions > 0.5).float()
                test_correct += (predicted_labels == y_batch).sum().item()
                test_total += y_batch.numel()
        
        test_acc = test_correct / test_total * 100
        
        # Print progress every 5 epochs
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"   Epoch {epoch+1:2d}/{num_epochs} | Loss: {avg_loss:.4f} | Train Acc: {train_acc:.1f}% | Test Acc: {test_acc:.1f}%")
        
        # Save best model
        if test_acc > best_test_acc:
            best_test_acc = test_acc
            model_path = os.path.join(os.path.dirname(__file__), "model", "dkt_model.pt")
            torch.save(model.state_dict(), model_path)
    
    print(f"\n✅ Training Complete!")
    print(f"   Best Test Accuracy: {best_test_acc:.1f}%")
    print(f"   Model saved to: ml-engine/model/dkt_model.pt")
    print("="*50)


if __name__ == "__main__":
    train_model()
