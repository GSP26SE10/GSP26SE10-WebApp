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
import OwnerMenu from "@/pages/Owner/OwnerMenu";
import OwnerDish from "@/pages/Owner/OwnerDish";
import OwnerDishCategory from "@/pages/Owner/OwnerDishCategory";
import OwnerService from "@/pages/Owner/OwnerService";
export default function App() {
  return (
    <Router>
      <div>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/owner">
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="menu" element={<OwnerMenu />} />
              <Route path="dish" element={<OwnerDish />} />
              <Route path="dish-category" element={<OwnerDishCategory />} />
              <Route path="service" element={<OwnerService />} />
            </Route>
          </Routes>
          <Toaster />
        </main>
      </div>
    </Router>
  );
}
