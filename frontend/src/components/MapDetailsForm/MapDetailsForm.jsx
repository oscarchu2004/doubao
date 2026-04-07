import React, { useState } from 'react'
import './MapDetailsForm.css'
import { useNavigate } from 'react-router-dom'
import img1 from '../../assets/images/signup.jpg'
import { baseURL } from '../../utils/baseUrl'
import axios from 'axios'

const MapDetailsForm = ({ onClose, onSave, isEdit = false, existingMap = null }) => {
    const [formData, setFormData] = useState({
        title: existingMap?.title || '',
        description: existingMap?.description || '',
        minimapPath: existingMap?.minimapPath || '',
        thumbnailPath: existingMap?.thumbnailPath || '',
        isPublic: existingMap?.isPublic || false,
        initialView: {
            yaw: existingMap?.initialView?.yaw || 0,
            pitch: existingMap?.initialView?.pitch || 0,
            hfov: existingMap?.initialView?.hfov || 125
        }
    })

    // File states
    const [minimapFile, setMinimapFile] = useState(null)
    const [thumbnailFile, setThumbnailFile] = useState(null)

    const [thumbnailPreview, setThumbnailPreview] = useState(existingMap?.thumbnailPath || null)

    // Upload states
    const [uploading, setUploading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const navigate = useNavigate()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target

        if (name === 'yaw' || name === 'pitch' || name === 'hfov') {
            setFormData({
                ...formData,
                initialView: {
                    ...formData.initialView,
                    [name]: Number(value)
                }
            })
        } else if (type === 'checkbox') {
            setFormData({
                ...formData,
                [name]: checked
            })
        } else {
            setFormData({
                ...formData,
                [name]: value
            })
        }
    }

    // Handle minimap file selection
    const handleMinimapFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setMinimapFile(file)
        }
    }

    // Handle thumbnail file selection
    const handleThumbnailFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setThumbnailFile(file)
            // Create preview
            const reader = new FileReader()
            reader.onload = () => setThumbnailPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    // Upload file to S3
    const uploadToS3 = async (file) => {
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)

            const response = await axios.post(
		`${baseURL}/upload/local`,
                formDataUpload,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                }
            )

            return response.data.url
        } catch (error) {
            console.error('S3 upload failed:', error)
            throw new Error(error.response?.data?.error || 'Upload failed')
        }
    }

    // Upload all files if selected
    const uploadFiles = async () => {
        const uploads = []

        // Upload minimap if selected
        if (minimapFile) {
            uploads.push(
                uploadToS3(minimapFile).then(url => ({ type: 'minimap', url }))
            )
        }

        // Upload thumbnail if selected
        if (thumbnailFile) {
            uploads.push(
                uploadToS3(thumbnailFile).then(url => ({ type: 'thumbnail', url }))
            )
        }

        if (uploads.length === 0) return {}

        const results = await Promise.all(uploads)

        // Convert results to object
        const uploadedUrls = {}
        results.forEach(result => {
            if (result.type === 'minimap') uploadedUrls.minimapPath = result.url
            if (result.type === 'thumbnail') uploadedUrls.thumbnailPath = result.url
        })

        return uploadedUrls
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!formData.title) {
            setErrorMessage('Title is required')
            setSuccessMessage('')
            return
        }

        try {
            setUploading(true)
            setErrorMessage('')
            setSuccessMessage('')

            // Upload files to S3 first
            const uploadedUrls = await uploadFiles()

            // Prepare final data - Fixed field names to match backend
            const finalData = {
                title: formData.title,
                description: formData.description,
                minimapPath: uploadedUrls.minimapPath || formData.minimapPath,
                thumbnailPath: uploadedUrls.thumbnailPath || formData.thumbnailPath,
                isPublic: formData.isPublic,
                initialView: formData.initialView
            }

            // Create map with the data
            const response = await axios.post(
                `${baseURL}/maps/create`,
                finalData,
                { withCredentials: true }
            )

            // Success
            setSuccessMessage('Map created successfully!')

            // Navigate to the new map after a short delay
            setTimeout(() => {
                navigate(`/map/${response.data.map._id}/edit`)
            }, 2000)

        } catch (error) {
            console.error('Error creating map:', error)
            if (error.response) {
                setErrorMessage(error.response.data.error || 'Failed to create map')
            } else {
                setErrorMessage(error.message || 'Network error. Please try again.')
            }
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className='popup-overlay'>
            <div className='container d-flex justify-content-center align-items-center'>
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
                        <div className='row align-items-left'>
                            <div className='header-text mb-4 text-start'>
                                <h1>Create Map</h1>
                                <p>Enter details for your virtual tour map</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Title */}
                                <div className='mb-3'>
                                    <input
                                        type='text'
                                        className='form-control form-control-lg bg-light fs-6 input-field'
                                        placeholder='Map Title'
                                        name='title'
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className='mb-3'>
                                    <textarea
                                        className='form-control form-control-lg bg-light fs-6 input-field'
                                        placeholder='Map Description'
                                        name='description'
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                    />
                                </div>

                                {/* Thumbnail Upload */}
                                <div className='mb-3'>
                                    <label className='form-label' style={{ textAlign: 'left', color: '#6c757d' }}>Thumbnail Image</label>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        onChange={handleThumbnailFileChange}
                                        className='form-control form-control-lg bg-light fs-6 input-field'
                                        disabled={uploading}
                                    />
                                    {thumbnailPreview && (
                                        <div className='mt-2'>
                                            <img
                                                src={thumbnailPreview}
                                                alt='Thumbnail Preview'
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Minimap Upload */}
                                <div className='mb-3'>
                                    <label className='form-label' style={{ textAlign: 'left', color: '#6c757d' }}>Minimap Image</label>
                                    <input
                                        type='file'
                                        accept='image/*'
                                        onChange={handleMinimapFileChange}
                                        className='form-control form-control-lg bg-light fs-6 input-field'
                                        disabled={uploading}
                                    />
                                </div>

                                {/* Public Toggle */}
                                <div className='form-check form-switch mb-3'>
                                    <label className='form-check-label' htmlFor='isPublicSwitch'>
                                        Make map public
                                    </label>
                                    <input
                                        className='form-check-input'
                                        type='checkbox'
                                        id='isPublicSwitch'
                                        name='isPublic'
                                        checked={formData.isPublic}
                                        onChange={handleChange}
                                        disabled={uploading}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className='mb-1 mt-3'>
                                    <button
                                        type='submit'
                                        className='btn btn-lg btn-primary w-100 fs-6 create-map-btn'
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Creating Map...' : 'Create Map'}
                                    </button>
                                </div>

                                {/* Divider */}
                                <div style={{ width: '100%', height: '15px', borderBottom: '0.5px solid #8E8D8D', textAlign: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#8E8D8D', backgroundColor: 'white', padding: '0 5px' }}>
                                        or
                                    </span>
                                </div>

                                {/* Cancel Button */}
                                <div className='mt-3'>
                                    <button
                                        type='button'
                                        className='btn btn-lg w-100 fs-6 cancel-btn'
                                        onClick={onClose}
                                        disabled={uploading}
                                    >
                                        I'll do it later
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <img
                        src={img1}
                        alt='map background'
                        className='col-md-6 rounded-5 left-box mb-2 mt-2 object-fit-cover img-fluid'
                    />
                </div>
            </div>
        </div>
    )
}

export default MapDetailsForm
