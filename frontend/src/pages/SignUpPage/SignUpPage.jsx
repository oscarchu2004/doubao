import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import img from '../../assets/images/signup.jpg'
import 'bootstrap/dist/css/bootstrap.min.css'
import { baseURL } from '../../utils/baseUrl'
import './SignupPage.css'
import axios from 'axios'

const SignUpPage = () => {
    const navigate = useNavigate()
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [email, setEmail] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password) {
            setErrorMessage('All fields are required.')
            return
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match')
            return
        }

        try {
            const response = await axios.post(`${baseURL}/auth/signup`, {
                firstName,
                lastName,
                email,
                password
            })

            setErrorMessage('')
            setSuccessMessage('Registration successful')
            setTimeout(() => {
                navigate('/login')
            }, 1000)
        } catch (error) {
            if (error.response) {
                const errorData = error.response.data
                setErrorMessage(errorData.error)
            }
        }
    }

    const handleLoginClick = () => {
        navigate('/login')
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

                <div className='col-md-6 right-box'>
                    <div className='row align-items-center'>
                        <div className='header-text mb-4 text-start'>
                            <h1>Sign Up</h1>
                            <p>Create your account to get started</p>
                        </div>
                        <form>
                            <div className='mb-3'>
                                <input
                                    type='email'
                                    className='form-control form-control-lg bg-light fs-6 input-field'
                                    placeholder='Email address'
                                    id='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className='row mb-3'>
                                <div className='col'>
                                    <input
                                        type='text'
                                        className='form-control form-control-lg bg-light fs-6 input-field'
                                        placeholder='First Name'
                                        id='firstName'
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className='col'>
                                    <input
                                        type='text'
                                        className='form-control form-control-lg bg-light fs-6 input-field'
                                        placeholder='Last Name'
                                        id='lastName'
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className='mb-3'>
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
                            <div className='mb-3'>
                                <input
                                    type='password'
                                    className='form-control form-control-lg bg-light fs-6 input-field'
                                    placeholder='Confirm Password'
                                    id='confirmPassword'
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className='mb-3 mt-4'>
                                <button
                                    type='button'
                                    className='btn btn-lg btn-primary w-100 fs-6 sign-up-btn'
                                    onClick={handleRegister}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                        <div className='row text-start'>
                            <small>
                                Already have an account? Login <span onClick={handleLoginClick} className='login-link'>here.</span>
                            </small>
                        </div>
                    </div>
                </div>

                <img
                    src={img}
                    alt='cornfield'
                    className='col-md-6 rounded-5 left-box mb-2 mt-2 object-fit-cover img-fluid'
                />
            </div>
        </div>
    )
}

export default SignUpPage
