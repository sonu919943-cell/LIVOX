import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
};

export default function Signup({ onUserNameChange }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const update = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Complete each required field to create your account.");
      return;
    }

    if (form.password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      await api("/signup", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      window.localStorage.setItem("livoxToken", data.token);
      onUserNameChange(data.user?.name || form.name.trim());
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="auth-next auth-next--signup">
      <section className="auth-next__story">
        <Link to="/login" className="auth-next__brand">
          <b>+</b>
          LIVOX
        </Link>
        <div>
          <p>START YOUR HEALTH WORKSPACE</p>
          <h1>
            Prepared care
            <br />
            starts with you.
          </h1>
          <span>
            Create your private LIVOX workspace and keep essential information
            organized before you need it.
          </span>
        </div>
        <div className="auth-next__points">
          <span>Your information stays in your control</span>
          <span>Build your emergency profile gradually</span>
          <span>Access tools from one calm workspace</span>
        </div>
      </section>

      <section className="auth-next__form">
        <div className="auth-next__form-inner auth-next__form-inner--signup">
          <Link to="/login" className="auth-next__mobile-brand">
            <b>+</b>
            LIVOX
          </Link>
          <p className="auth-next__eyebrow">CREATE YOUR ACCOUNT</p>
          <h2>Set up your LIVOX workspace</h2>
          <span className="auth-next__subtitle">
            Start with your account details. You can complete your medical
            profile later.
          </span>

          <form onSubmit={submit}>
            <div className="auth-next__grid">
              <label>
                Full name
                <input
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Phone number
                <input
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+91 00000 00000"
                />
              </label>
            </div>

            <label>
              Email address
              <input
                value={form.email}
                onChange={update("email")}
                type="email"
                placeholder="you@example.com"
              />
            </label>

            <div className="auth-next__grid">
              <label>
                Create password
                <input
                  value={form.password}
                  onChange={update("password")}
                  type="password"
                  placeholder="At least 6 characters"
                />
              </label>
              <label>
                Confirm password
                <input
                  value={form.confirm}
                  onChange={update("confirm")}
                  type="password"
                  placeholder="Repeat password"
                />
              </label>
            </div>

            {error && <p className="auth-next__error">{error}</p>}

            <label className="auth-next__terms">
              <input required type="checkbox" /> I agree to the Terms of
              Service and Privacy Policy.
            </label>
            <button>Create account</button>
          </form>

          <p className="auth-next__switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
