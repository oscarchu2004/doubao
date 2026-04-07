import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import img from '../../assets/images/login.jpg'
import 'bootstrap/dist/css/bootstrap.min.css'
import { baseURL } from '../../utils/baseUrl'
import './LoginPage.css'
import axios from 'axios'

const LoginPage = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${baseURL}/auth/login`, {
                email,
                password
            }, {
                withCredentials: true
            });

            const { data } = response
            const loggedInUser = {
                userId: data.user.userId,
                email: data.user.email,
                role: data.user.role,
                firstName: data.user.firstName,
                lastName: data.user.lastName
            };
            localStorage.setItem('user', JSON.stringify(loggedInUser))

            setErrorMessage('')
            setSuccessMessage(data.message)

            setTimeout(() => {
                navigate('/')
            }, 1000)
        } catch (error) {
            if (error.response) {
                const errorData = error.response.data
                setSuccessMessage('')
                setErrorMessage(errorData.error)
            }
        }
    }

    const handleSignupClick = () => {
        navigate('/signup')
    }

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
                    alt='sunset'
                    className='col-md-6 rounded-5 left-box mb-2 mt-2 object-fit-cover img-fluid'
                />
                <div className='col-md-6 right-box'>
                    <div className='row align-items-center'>
                        <div className='header-text mb-4 text-start'>
                            <h2>Hey there!</h2>
                            <p>Missed us? We sure missed you.</p>
                        </div>
                        <form>
                            <div className='password-box mb-3'>
                                <input
                                    type='text'
                                    className='form-control form-control-lg bg-light fs-6 input-field'
                                    placeholder='Email address'
                                    id='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='password-box'>
                                <input
                                    type='password'
                                    className='form-control form-control-lg bg-light fs-6 input-field'
                                    placeholder='Password'
                                    id='password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='mb-3 mt-4'>
                                <button
                                    type='button'
                                    className='btn btn-lg btn-primary w-100 fs-6 login-btn'
                                    onClick={handleLogin}
                                >
                                    Login
                                </button>
                            </div>
                        </form>
                        <div className='row text-start'>
                            <small>
                                Don't have an account? Sign up <span onClick={handleSignupClick} className='signup-link'>here</span>.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
