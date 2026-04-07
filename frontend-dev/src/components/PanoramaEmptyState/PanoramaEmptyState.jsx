import React from 'react';
import { Card } from 'react-bootstrap';
import AddPanoramaButton from '../AddPanoramaButton/AddPanoramaButton';

const PanoramaEmptyState = ({
    mapId,
    isEditMode = false,
    onPanoramaAdded = () => { },
    height = "400px",
    // Messages
    minimapPath,
    title = "No panorama selected",
    description = "Select a panorama to view",
    noEditMessage = "Contact the map creator to add panoramas"
}) => {
    return (
        <Card className="text-center border-0" style={{ height }}>
            <Card.Body className="d-flex flex-column justify-content-center">
                <div className="mb-3">
                    <i className="bi bi-camera text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <h4 className="text-muted">{title}</h4>
                    <p className="text-muted">{description}</p>
                </div>

                {isEditMode ? (
                    <div className="d-flex justify-content-center">
                        <AddPanoramaButton
                            mapId={mapId}
                            onPanoramaAdded={onPanoramaAdded}
                            buttonText="Choose File to Upload"
                            minimapPath={minimapPath}
                        />
                    </div>
                ) : (
                    <p className="text-muted">{noEditMessage}</p>
                )}
            </Card.Body>
        </Card>
    );
};

export default PanoramaEmptyState;