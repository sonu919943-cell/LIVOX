import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

function getNameFromEmail(email) {
  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Login({ onUserNameChange }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      window.localStorage.setItem("livoxToken", data.token);
      onUserNameChange(data.user?.name || getNameFromEmail(email));
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="auth-next">
      <section className="auth-next__story">
        <Link to="/login" className="auth-next__brand">
          <b>+</b>
          LIVOX
        </Link>
        <div>
          <p>PERSONAL HEALTH WORKSPACE</p>
          <h1>
            Care information,
            <br />
            ready when it counts.
          </h1>
          <span>
            One private place for your emergency profile, medical reports,
            trusted contacts, and care tools.
          </span>
        </div>
        <div className="auth-next__points">
          <span>Private by design</span>
          <span>Built for emergencies</span>
          <span>Easy to keep current</span>
        </div>
      </section>

      <section className="auth-next__form">
        <div className="auth-next__form-inner">
          <Link to="/login" className="auth-next__mobile-brand">
            <b>+</b>
            LIVOX
          </Link>
          <p className="auth-next__eyebrow">WELCOME BACK</p>
          <h2>Sign in to your workspace</h2>
          <span className="auth-next__subtitle">
            Use your account details to continue to LIVOX.
          </span>

          <form onSubmit={submit}>
            <label>
              Email address
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                placeholder="Enter your password"
              />
            </label>

            {error && <p className="auth-next__error">{error}</p>}

            <div className="auth-next__options">
              <label>
                <input type="checkbox" /> Remember this device
              </label>
              <a href="#forgot-password">Forgot password?</a>
            </div>
            <button>Sign in</button>
          </form>

          <p className="auth-next__switch">
            New to LIVOX? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
