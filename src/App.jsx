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
import OwnerPendingOrders from "@/pages/Owner/OwnerPendingOrders";
import OwnerTrackingOrder from "./pages/Owner/OwnerTrackingOrder";
import OwnerPartyCategory from "./pages/Owner/OwnerPartyCategory";
import OwnerIngredient from "./pages/Owner/OwnerIngredient";
import OwnerStaffManagement from "./pages/Owner/OwnerStaffManagment";
import OwnerStaffSchedule from "./pages/Owner/OwnerStaffSchedule";
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
              <Route path="orders/pending" element={<OwnerPendingOrders />} />
              <Route path="orders/tracking" element={<OwnerTrackingOrder />} />
              <Route path="party-category" element={<OwnerPartyCategory />} />
              <Route path="ingredient" element={<OwnerIngredient />} />
              <Route path="staff" element={<OwnerStaffManagement />} />
              <Route path="staff-schedule" element={<OwnerStaffSchedule />} />
            </Route>
          </Routes>
          <Toaster />
        </main>
      </div>
    </Router>
  );
}
