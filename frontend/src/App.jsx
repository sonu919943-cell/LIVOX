import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

const DEFAULT_USER_NAME = "Guest User";

function getStoredUserName() {
  return window.localStorage.getItem("livoxUserName") || DEFAULT_USER_NAME;
}

export default function App() {
  const { pathname } = useLocation();
  const [userName, setUserName] = useState(getStoredUserName);
  const isPublicPage = pathname === "/login" || pathname === "/signup";

  const saveUserName = (name) => {
    window.localStorage.setItem("livoxUserName", name);
    setUserName(name);
  };

  const logout = () => {
    window.localStorage.clear();
    setUserName(DEFAULT_USER_NAME);
  };

  return (
    <>
      <AppRoutes userName={userName} onUserNameChange={saveUserName} />
      {!isPublicPage && (
        <Link className="global-logout" to="/login" onClick={logout}>
          Log out
        </Link>
      )}
    </>
  );
}
