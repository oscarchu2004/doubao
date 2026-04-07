import './App.css'
import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/LoginPage/LoginPage'
import SignupPage from '../pages/SignUpPage/SignUpPage'
import HomePage from '../pages/HomePage/HomePage'
import MapViewPage from '../pages/MapViewPage/MapViewPage'
import Header from '../components/Header/Header'

function App() {
    return (
        <div className='App content'>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path='/login' element={<LoginPage />} />
                    <Route path='/signup' element={<SignupPage />} />

                    <Route element={<Header />}>  
                        <Route path='/' element={<HomePage />} />
                        <Route path='/map/:mapId' element={<MapViewPage />} />
                        <Route path='/map/:mapId/edit' element={<MapViewPage isEditMode={true} />} />
                    </Route>
                </Routes>
            </Router>
        </div>
    )
}

export default App
