import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Roadmap from "./pages/Roadmap";
import StudyGuide from "./pages/StudyGuide";
import Visualization from "./pages/Visualization";
import Community from "./pages/Community";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />

              <Route
                path="/upload"
                element={
                  <ProtectedRoute defaultModal="signup">
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <ProtectedRoute defaultModal="signup">
                    <Roadmap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/study-guide"
                element={
                  <ProtectedRoute defaultModal="signup">
                    <StudyGuide />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/visualization"
                element={
                  <ProtectedRoute defaultModal="signup">
                    <Visualization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute defaultModal="signup">
                    <Community />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
