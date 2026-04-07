import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { baseURL } from '../../utils/baseUrl';
import { extractImagePath } from '../../utils/helperFunction';
import './AddPanoramaForm.css';

const AddPanoramaForm = ({ show, onClose, onPanoramaAdded, mapId, minimapPath }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    panoramaFile: null,
    imagePath: '',
    positionOnMinimap: { x: '', y: '' }
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // NEW STATE FOR MINIMAP PICKER
  const [showMinimapPicker, setShowMinimapPicker] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePositionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      positionOnMinimap: {
        ...prev.positionOnMinimap,
        [name]: value === '' ? '' : parseInt(value, 10)
      }
    }));
  };

  const handleFileChange = (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setFormData(prev => ({
      ...prev,
      panoramaFile: file,
      imagePath: '' // Will be set after upload
    }));

    // create a preview URL
    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewUrl(fileReader.result);
    };
    fileReader.readAsDataURL(file);
  };

  // Upload file to S3
  const uploadToS3 = async (file) => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);


      const response = await axios.post(
	`${baseURL}/upload/local`,
        formDataUpload,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      return response.data.url;
    } catch (error) {
      console.error('S3 upload failed:', error);
      throw new Error(error.response?.data?.error || 'Upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.panoramaFile) {
      setError('Title and panorama image are required');
      setSuccessMessage('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage(''); // clear any previous success message

      // Upload panorama to S3 first
      const uploadedImagePath = await uploadToS3(formData.panoramaFile);

      // create normal JSON body for the panorama data
      const panoramaData = {
        mapId: mapId,
        title: formData.title,
        description: formData.description,
        imagePath: uploadedImagePath,
        positionOnMinimap: {
          x: formData.positionOnMinimap.x || 0,
          y: formData.positionOnMinimap.y || 0
        }
      };

      console.log('Creating panorama with data:', panoramaData);

      // send the JSON data to create the panorama
      const response = await axios.post(
        `${baseURL}/panoramas/create`,
        panoramaData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Panorama creation response:', response.data);

      if (response.data) {
        // verify the panorama object has required fields
        const createdPanorama = response.data.panorama;
        if (!createdPanorama || !createdPanorama._id) {
          console.warn('Warning: Created panorama missing _id field:', createdPanorama);
          setError('Panorama created but missing required data. Please refresh the page.');
          return;
        }

        // set success message
        setSuccessMessage(response.data.message);

        // Call onPanoramaAdded callback if provided
        if (onPanoramaAdded && typeof onPanoramaAdded === 'function') {
          console.log('Calling onPanoramaAdded with:', createdPanorama);
          onPanoramaAdded(createdPanorama);
        }

        // auto-close the form after a brief delay
        setTimeout(() => {
          console.log('Auto-closing form after successful creation');
          resetForm();
          if (onClose && typeof onClose === 'function') {
            onClose();
          }
        }, 1500); // reduced to 1.5 seconds for better UX

      } else {
        setError(response.data.message || 'Failed to create panorama');
      }
    } catch (error) {
      console.error('Error creating panorama:', error);
      setError(error.response?.data?.message || 'An error occurred while creating the panorama');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      panoramaFile: null,
      imagePath: '',
      positionOnMinimap: { x: '', y: '' }
    });
    setPreviewUrl(null);
    setError('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className='popup-overlay' style={{ display: show ? 'flex' : 'none' }}>
      <div className='row border rounded-5 p-3 bg-white shadow box-area'>
        <div className='col-12 panorama-form'>
          {/* success message with close option */}
          {successMessage && !error && (
            <div className='alert alert-success d-flex justify-content-center align-items-center rounded-4'>
              <span>{successMessage}</span>
            </div>
          )}

          {/* error message */}
          {error && !successMessage && (
            <div className='alert alert-danger rounded-4'>
              {error}
            </div>
          )}

          <div className='header-text mb-4 text-start'>
            <h2>Add a New Panorama</h2>
            <p>Create your panorama to get started</p>
          </div>

          <Form onSubmit={handleSubmit}>
            <div className='mb-3'>
              <Form.Control
                type='text'
                className='form-control form-control-lg bg-light fs-6 input-field'
                name='title'
                value={formData.title}
                onChange={handleInputChange}
                placeholder='Panorama Title'
                required
              />
            </div>

            <div className='mb-3'>
              <Form.Control
                as='textarea'
                className='form-control form-control-lg bg-light fs-6 input-field'
                name='description'
                value={formData.description}
                onChange={handleInputChange}
                placeholder='Panorama Description (optional)'
                rows={3}
              />
            </div>

            {/* Button, "or", X Position, Y Position in same row */}
            <div className='row mb-3 align-items-center'>
              <div className='col-md-3'>
                <Button
                  className='btn btn-lg w-100 fs-6 adjust-coordinates-btn'
                  onClick={() => setShowMinimapPicker(true)}
                >
                  Adjust coordinates
                </Button>
              </div>
              <div className='col-md-1 text-center'>
                <span className='coordinates-or-text'>
                  or
                </span>
              </div>
              <div className='col-md-4'>
                <Form.Control
                  type='number'
                  className='form-control form-control-lg bg-light fs-6 input-field'
                  name='x'
                  value={formData.positionOnMinimap.x}
                  onChange={handlePositionChange}
                  placeholder='X Position on Minimap'
                />
              </div>
              <div className='col-md-4'>
                <Form.Control
                  type='number'
                  className='form-control form-control-lg bg-light fs-6 input-field'
                  name='y'
                  value={formData.positionOnMinimap.y}
                  onChange={handlePositionChange}
                  placeholder='Y Position on Minimap'
                />
              </div>
            </div>

            <div className='mb-3'>
              <Form.Text className='text-muted'>
                Please upload a 360° equirectangular image.
              </Form.Text>
              <Form.Control
                type='file'
                accept='image/*'
                onChange={handleFileChange}
                required
                className='form-control form-control-lg bg-light fs-6 input-field'
              />
              {formData.imagePath && (
                <Form.Text className='text-muted d-block mt-1'>
                  Image Preview: {formData.imagePath}
                </Form.Text>
              )}
            </div>

            {previewUrl && (
              <div className='mt-3 mb-3'>
                <div className='image-preview-container'>
                  <img
                    src={previewUrl}
                    alt='Preview'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Show/hide minimap picker overlay */}
            {showMinimapPicker && (
              <div className='picker-overlay d-flex justify-content-center align-items-center'>
                <div className='picker-content position-relative'>
                  <h5>Select position on minimap</h5>
                  <img
                    src={minimapPath}
                    alt='Minimap picker'
                    style={{ maxWidth: '800px', cursor: 'crosshair' }}
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const clickY = e.clientY - rect.top;

                      // get displayed dimensions
                      const displayedWidth = e.currentTarget.clientWidth;
                      const displayedHeight = e.currentTarget.clientHeight;

                      // convert to normalized coordinates (0.0 to 1.0)
                      const normalizedX = clickX / displayedWidth;
                      const normalizedY = clickY / displayedHeight;

                      // clamp to ensure values are between 0 and 1
                      const clampedX = Math.max(0, Math.min(1, normalizedX));
                      const clampedY = Math.max(0, Math.min(1, normalizedY));

                      setFormData(prev => ({
                        ...prev,
                        positionOnMinimap: {
                          x: clampedX,  // store as 0.0 to 1.0
                          y: clampedY   // store as 0.0 to 1.0
                        }
                      }));
                      setShowMinimapPicker(false);
                    }}
                  />
                  <div>
                    <Button
                      variant='outline-danger'
                      size='sm'
                      className='mt-2'
                      onClick={() => setShowMinimapPicker(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}


            <div className='mb-1 mt-3'>
              <button
                type='submit'
                className='btn btn-lg w-100 fs-6 create-panorama-btn'
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Panorama'}
              </button>
            </div>

            {/* ------------ or------------ line */}
            <div style={{ width: '100%', height: '15px', borderBottom: '0.5px solid #8E8D8D', textAlign: 'center' }}>
              <span style={{ fontSize: '13px', color: '#8E8D8D', backgroundColor: 'white', padding: '0 5px' }}>
                or
              </span>
            </div>

            <div className='mt-3'>
              <button
                type='button'
                className='btn btn-lg w-100 fs-6 cancel-btn'
                onClick={handleClose}
              >
                Cancel
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddPanoramaForm;
