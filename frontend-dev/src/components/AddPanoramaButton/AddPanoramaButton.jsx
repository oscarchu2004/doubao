import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import AddPanoramaForm from '../AddPanoramaForm/AddPanoramaForm';
import { useState } from 'react';
import './AddPanoramaButton.css';
import MiniMap from '../minimap/MiniMap';
import { getUploadedFileUrl } from '../../utils/helperFunction';

const AddPanoramaButton = ({
    mapId,
    onPanoramaAdded,
    buttonText,
    variant = "primary",
    size = "md",
    className = "",
    minimapPath
}) => {
    const [showModal, setShowModal] = useState(false);

    const handleShow = () => setShowModal(true);
    const handleClose = () => setShowModal(false);

    const handlePanoramaAdded = (panorama) => {
        handleClose();
        if (onPanoramaAdded) {
            onPanoramaAdded(panorama);
        }
    };

    return (
        <>
            <Button
                onClick={handleShow}
                className={`add-panorama-btn ${className}`}
                variant={variant}
            >
                <Badge
                    bg="light"
                    className="panorama-btn-badge"
                >
                    <i className="bi bi-plus panorama-btn-icon"></i>
                </Badge>
                <span className="panorama-btn-text">
                    {buttonText}
                </span>
            </Button>

            {showModal && (
                <AddPanoramaForm
                    show={showModal}
                    onClose={handleClose}
                    mapId={mapId}
                    onPanoramaAdded={handlePanoramaAdded}
                    minimapPath={minimapPath}
                />
            )}
        </>
    );
};

export default AddPanoramaButton;
