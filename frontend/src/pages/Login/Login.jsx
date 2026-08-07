import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Button from '../../components/Button/Button'

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function submit(event) {

        event.preventDefault();

        setError('');

        // Check empty fields
        if (!email || !password) {
            setError('Enter your email and password.');
            return;
        }

        try {

            // Send login data to Flask
            const response = await axios.post(
                'http://127.0.0.1:5000/login',
                {
                    email: email,
                    password: password
                }
            );

            console.log(response.data);

            // Save JWT token
            localStorage.setItem(
                'token',
                response.data.token
            );

            // Login successful
            navigate('/dashboard');

        } catch (error) {

            console.log(error);

            setError(
                error.response?.data?.message ||
                'Login failed. Please try again.'
            );
        }
    }

    return (
        <main className="auth-page">

            <section className="auth-panel auth-panel--intro">

                <div className="auth-intro__content">

                    <div className="brand-lockup">
                        <span className="brand-mark">L</span>
                        LIVOX
                    </div>

                    <p className="eyebrow">
                        YOUR HEALTH, ALWAYS WITHIN REACH
                    </p>

                    <h1>
                        Care that stays
                        <br />
                        connected to you.
                    </h1>

                    <p className="auth-intro__text">
                        Keep your vital medical information secure,
                        accessible, and ready when every second matters.
                    </p>

                    <div className="auth-intro__card">
                        <span className="auth-intro__pulse">+</span>
                        Smart emergency care, wherever you are.
                    </div>

                </div>

            </section>


            <section className="auth-panel auth-panel--form">

                <div className="auth-form-wrap">

                    <div className="auth-mobile-brand">
                        <span className="brand-mark">L</span>
                        LIVOX
                    </div>

                    <p className="eyebrow">
                        WELCOME BACK
                    </p>

                    <h2>
                        Sign in to LIVOX
                    </h2>

                    <p className="auth-subtitle">
                        Enter your details to access your health dashboard.
                    </p>


                    <form
                        className="auth-form"
                        onSubmit={submit}
                    >

                        <input
                            className="input-group__control"
                            placeholder="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />


                        <input
                            className="input-group__control"
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />


                        {error && (
                            <span className="input-group__error">
                                {error}
                            </span>
                        )}


                        <div className="form-options">

                            <label>
                                <input type="checkbox" />
                                Remember me
                            </label>

                            <a href="#forgot">
                                Forgot password?
                            </a>

                        </div>


                        <Button type="submit">
                            Sign In
                        </Button>

                    </form>


                    <p className="auth-switch">
                        New to LIVOX?{' '}
                        <Link to="/signup">
                            Create an account
                        </Link>
                    </p>

                </div>

            </section>

        </main>
    );
}