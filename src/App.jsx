import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import OwnerDashboard from "@/pages/Owner/OwnerDashboard";
export default function App() {
  return (
    <Router>
      <div>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ownerdashboard" element={<OwnerDashboard />} />
          </Routes>
          <Toaster />
        </main>
      </div>
    </Router>
  );
}
