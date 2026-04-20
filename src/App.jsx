import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
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
import OwnerAccountPage from "./pages/Owner/OwnerAccountPage";
import OwnerBlog from "./pages/Owner/OwnerBlog";
import OwnerFeedback from "./pages/Owner/OwnerFeedback";
import OwnerTaskTemplate from "./pages/Owner/OwnerTaskTemplate";
import OwnerExtraChargeCatalog from "./pages/Owner/OwnerExtraChargeCatalog";
import OwnerContactRequest from "./pages/Owner/OwnerContactRequest";
import OwnerMenuCategory from "./pages/Owner/OwnerMenuCategory";
import useAutoLogout from "./utils/useAutoLogout";
function RequireAuth({ children }) {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}

function AppContent() {
  useAutoLogout();

  return (
    <main>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/owner" element={<RequireAuth />}>
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
          <Route path="account" element={<OwnerAccountPage />} />
          <Route path="blog" element={<OwnerBlog />} />
          <Route path="feedback" element={<OwnerFeedback />} />
          <Route path="task-template" element={<OwnerTaskTemplate />} />
          <Route path="contact-request" element={<OwnerContactRequest />} />
          <Route path="menu-category" element={<OwnerMenuCategory />} />
          <Route path="extra-charge" element={<OwnerExtraChargeCatalog />} />
        </Route>
      </Routes>

      <Toaster />
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
