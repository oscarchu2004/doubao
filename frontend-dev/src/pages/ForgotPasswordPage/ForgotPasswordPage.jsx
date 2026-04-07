import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import img from '../../assets/images/forgotpassword.jpg'
import 'bootstrap/dist/css/bootstrap.min.css'
import { baseURL } from '../../utils/baseUrl'
import './ForgotPasswordPage.css'
import axios from 'axios'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleReset = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await axios.post(`${baseURL}/auth/forgot-password`, {
        email,
        newPassword
      })

      setSuccessMessage(response.data.message)
      setTimeout(() => navigate('/login'), 1500)
    } catch (error) {
      if (error.response) {
        setErrorMessage(error.response.data.error || 'Something went wrong.')
      }
    }
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
          alt='forgot-password'
          className='col-md-6 rounded-5 left-box mb-2 mt-2 object-fit-cover img-fluid'
        />
        <div className='col-md-6 right-box'>
          <div className='row align-items-center'>
            <div className='header-text mb-4 text-start'>
              <h2>Reset your password</h2>
              <p>Enter your email and a new password to update your account.</p>
            </div>
            <form>
              <div className='mb-3'>
                <input
                  type='email'
                  className='form-control form-control-lg bg-light fs-6 input-field'
                  placeholder='Email address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className='mb-3'>
                <input
                  type='password'
                  className='form-control form-control-lg bg-light fs-6 input-field'
                  placeholder='New Password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className='mb-3 mt-4'>
                <button
                  type='button'
                  className='btn btn-lg btn-primary w-100 fs-6 login-btn'
                  onClick={handleReset}
                >
                  Reset Password
                </button>
              </div>
            </form>
            <div className='row text-start'>
              <small>
                Remembered your password?{' '}
                <span
                  onClick={() => navigate('/login')}
                  className='signup-link'
                  style={{ cursor: 'pointer' }}
                >
                  Go back to login
                </span>.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
