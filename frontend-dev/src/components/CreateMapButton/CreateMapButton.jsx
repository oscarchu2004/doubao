import React, { useState } from 'react';
import { Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './CreateMapButton.css';
import MapDetailsForm from '../MapDetailsForm/MapDetailsForm'; // Import the form component
import { getUploadedFileUrl } from '../../utils/helperFunction';

const CreateMapButton = () => {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);

    // This will be called when the form is closed without submission
    const handleClose = () => {
        setShowForm(false);
    };

    return (
        <>
            <Col xs={12} sm={6} md={4} className="mb-4">
                <div
                    className="create-map-button"
                    onClick={() => setShowForm(true)} // show form instead of creating map directly
                    role="button"
                    aria-label="Create new map"
                >
                    <div className="plus-icon">
                        <i className="bi bi-plus-lg"></i>
                    </div>
                    <span className="create-text">Create space</span>
                </div>
            </Col>

            {/* show the form when showForm is true */}
            {showForm && (
                <MapDetailsForm
                    onClose={handleClose}
                    isEdit={false}
                    existingMap={null}
                />
            )}
        </>
    );
};

export default CreateMapButton;
