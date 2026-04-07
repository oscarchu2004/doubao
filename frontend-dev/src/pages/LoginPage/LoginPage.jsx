import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import img from '../../assets/images/login.jpg';
import 'bootstrap/dist/css/bootstrap.min.css';
import { baseURL } from '../../utils/baseUrl';
import './LoginPage.css';
import axios from 'axios';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                `${baseURL}/auth/login`,
                { email, password },
                { withCredentials: true }
            );

            const { data } = response;
            const loggedInUser = {
                userId: data.user.userId,
                email: data.user.email,
                role: data.user.role,
                firstName: data.user.firstName,
                lastName: data.user.lastName
            };

            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(loggedInUser));
            } else {
                sessionStorage.setItem('user', JSON.stringify(loggedInUser));
            }

            setErrorMessage('');
            setSuccessMessage(data.message);

            setTimeout(() => navigate('/'), 1000);
        } catch (error) {
            if (error.response) {
                setSuccessMessage('');
                setErrorMessage(error.response.data.error);
            } else {
                setSuccessMessage('');
                setErrorMessage('Something went wrong. Please try again.');
            }
        }
    };

    const handleSignupClick = () => {
        navigate('/signup');
    };

    const handleForgotPasswordClick = () => {
        navigate('/forgot-password');
    };

    return (
        <div className='container d-flex justify-content-center align-items-center min-vh-100'>
            <div className='row border rounded-5 p-3 bg-white shadow box-area'>
                {errorMessage && (
                    <div className='col-12'>
                        <div className='alert rounded-4 alert-danger'>{errorMessage}</div>
                    </div>
                )}
                {successMessage && (
                    <div className='col-12'>
                        <div className='alert rounded-4 alert-success'>{successMessage}</div>
                    </div>
                )}

                <img
                    src={img}
                    alt='login'
                    className='col-md-6 rounded-5 left-box mb-2 mt-2 object-fit-cover img-fluid'
                />

                <div className='col-md-6 right-box'>
                    <div className='row align-items-center'>
                        <div className='header-text mb-4 text-start'>
                            <h2>Hey there!</h2>
                            <p>Missed us? We sure missed you.</p>
                        </div>

                        <form onSubmit={handleLogin} autoComplete="on">
                            <div className='mb-3'>
                                <input
                                    type='email'
                                    name='email'
                                    autoComplete='username'
                                    className='form-control form-control-lg bg-light fs-6 input-field'
                                    placeholder='Email address'
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className='mb-3'>
                                <input
                                    type='password'
                                    name='password'
                                    autoComplete='current-password'
                                    className='form-control form-control-lg bg-light fs-6 input-field'
                                    placeholder='Password'
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Remember Me checkbox aligned properly */}
                            <div className="form-check mb-3 d-flex align-items-center">
                                <input
                                    type='checkbox'
                                    className='form-check-input me-2'
                                    id='rememberMe'
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label className='form-check-label mb-0' htmlFor='rememberMe'>
                                    Remember Me
                                </label>
                            </div>

                            <div className='mb-3 mt-4'>
                                <button
                                    type='submit'
                                    className='btn btn-lg btn-primary w-100 fs-6 login-btn'
                                >
                                    Login
                                </button>
                            </div>
                        </form>

                        <div className='row text-start'>
                            <small>
                                Don't have an account?{' '}
                                <span onClick={handleSignupClick} className='signup-link'>
                                    Sign up here
                                </span>.
                            </small>
                        </div>

                        <div className='row text-start mt-2'>
                            <small>
                                Forgot your password?{' '}
                                <span
                                    onClick={handleForgotPasswordClick}
                                    className='signup-link'
                                    style={{ cursor: 'pointer' }}
                                >
                                    Reset it here
                                </span>.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
