import { Navigate, Route, Routes } from "react-router-dom";
import Account from "../pages/Account/Account";
import AIAssistant from "../pages/AIAssistant/AIAssistant";
import BloodDonor from "../pages/BloodDonor/BloodDonor";
import Dashboard from "../pages/Dashboard/Dashboard";
import EmergencyContacts from "../pages/EmergencyContacts/EmergencyContacts";
import Hospitals from "../pages/Hospitals/Hospitals";
import Login from "../pages/Login/Login";
import MedicalProfile from "../pages/MedicalProfile/MedicalProfile";
import QRCode from "../pages/QRCode/QRCode";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import Signup from "../pages/Signup/Signup";

export default function AppRoutes({ userName, onUserNameChange }) {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login onUserNameChange={onUserNameChange} />}
      />
      <Route
        path="/signup"
        element={<Signup onUserNameChange={onUserNameChange} />}
      />
      <Route path="/dashboard" element={<Dashboard userName={userName} />} />
      <Route
        path="/medical-profile"
        element={<MedicalProfile userName={userName} />}
      />
      <Route
        path="/emergency-contacts"
        element={<EmergencyContacts userName={userName} />}
      />
      <Route path="/reports" element={<Reports userName={userName} />} />
      <Route path="/qr-code" element={<QRCode userName={userName} />} />
      <Route path="/hospitals" element={<Hospitals userName={userName} />} />
      <Route
        path="/blood-donor"
        element={<BloodDonor userName={userName} />}
      />
      <Route
        path="/ai-assistant"
        element={<AIAssistant userName={userName} />}
      />
      <Route path="/account" element={<Account userName={userName} />} />
      <Route path="/settings" element={<Settings userName={userName} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
