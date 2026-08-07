import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Button from '../../components/Button/Button'

export default function Signup() {

    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    async function submit(event) {

        event.preventDefault()

        setError('')
        setMessage('')

        // Check passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        try {

            const response = await axios.post(
                'http://127.0.0.1:5000/signup',
                {
                    name: name,
                    email: email,
                    phone: phone,
                    password: password
                }
            )

            console.log(response.data)

            setMessage('Account created successfully!')

            // Go to login after signup
            setTimeout(() => {
                navigate('/login')
            }, 1000)

        } catch (error) {

            console.log(error)

            setError(
                error.response?.data?.message ||
                'Signup failed. Please try again.'
            )
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
                        SMART EMERGENCY SYSTEM
                    </p>

                    <h1>
                        Your health story,
                        <br />
                        safely in one place.
                    </h1>

                    <p className="auth-intro__text">
                        Create your account and be ready to share
                        the right information when it matters most.
                    </p>

                </div>

            </section>


            <section className="auth-panel auth-panel--form">

                <div className="auth-form-wrap">

                    <div className="auth-mobile-brand">
                        <span className="brand-mark">L</span>
                        LIVOX
                    </div>

                    <p className="eyebrow">
                        GET STARTED
                    </p>

                    <h2>
                        Create your account
                    </h2>

                    <p className="auth-subtitle">
                        Join LIVOX and take control of your medical profile.
                    </p>


                    <form
                        className="auth-form"
                        onSubmit={submit}
                    >

                        <input
                            className="input-group__control"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />


                        <input
                            className="input-group__control"
                            placeholder="Email address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />


                        <input
                            className="input-group__control"
                            placeholder="Phone number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />


                        <input
                            className="input-group__control"
                            placeholder="Create password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                        />


                        <input
                            className="input-group__control"
                            placeholder="Confirm password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />


                        {error && (
                            <span className="input-group__error">
                                {error}
                            </span>
                        )}


                        {message && (
                            <span className="input-group__success">
                                {message}
                            </span>
                        )}


                        <label className="terms">

                            <input
                                type="checkbox"
                                required
                            />

                            I agree to the terms and privacy policy.

                        </label>


                        <Button type="submit">
                            Create Account
                        </Button>

                    </form>


                    <p className="auth-switch">

                        Already have an account?{' '}

                        <Link to="/login">
                            Sign in
                        </Link>

                    </p>

                </div>

            </section>

        </main>
    )
}