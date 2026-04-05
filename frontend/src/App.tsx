import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import WorkspacePage from "./pages/WorkspacePage";
import { getStoredToken } from "./api/client";
function App() {
  const token = getStoredToken();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/workspace" : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/workspace" element={<WorkspacePage />} />
    </Routes>
  );
}
export default App;
