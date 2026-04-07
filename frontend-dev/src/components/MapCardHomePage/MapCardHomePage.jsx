import React, { useState } from 'react';
import { Card, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { baseURL } from '../../utils/baseUrl';
import DeleteConfirmationModal from '../DeleteConfirmationModal/DeleteConfirmationModal';
import './MapCardHomePage.css'
import { getUploadedFileUrl } from '../../utils/helperFunction';

const MapCardHomePage = ({ design, onMapDeleted = () => { } }) => {
    const navigate = useNavigate();
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        loading: false
    });

    // Defensive programming - handle undefined design
    if (!design) {
        return null;
    }

    // Use _id if id doesn't exist (MongoDB uses _id)
    const mapId = design.id || design._id;

    const handleCardClick = () => {
        navigate(`/map/${mapId}`);
    };

    const handleDeleteClick = () => {
        setDeleteModal({
            show: true,
            loading: false
        });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({
            show: false,
            loading: false
        });
    };

    const handleDeleteConfirm = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            await axios.delete(
                `${baseURL}/maps/delete/${mapId}`,
                { withCredentials: true }
            );
            handleDeleteCancel();
            onMapDeleted(mapId);
        } catch (error) {
            console.error('Error deleting map:', error);
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <Col xs={12} sm={6} md={4} className="mb-4">
            <Card className="design-card h-100 border-0 shadow-sm" onClick={handleCardClick}>
                <Button
                    variant="danger"
                    size="sm"
                    className="delete-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick();
                    }}
                >
                    <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
                </Button>
                <div className="card-thumbnail-container">
                    <div
                        className="card-thumbnail"
                        style={{ backgroundColor: '#f0f0f0' }}
                    >
                        {design.thumbnailPath && (
                            <img
                                src={design.thumbnailPath}
                                alt="Map thumbnail"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 'inherit'
                                }}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                </div>
                <Card.Body className="p-3">
                    <div className="d-flex justify-content-between">
                        <div>
                            <h6 className="design-title">{design.title || 'Untitled Map'}</h6>
                            <p className="design-meta">
                                <span className={`visibility-badge ${design.isPublic ? 'public' : 'private'}`}>
                                    {design.isPublic ? 'Public' : 'Private'}
                                </span>
                                <span className="bullet-separator">•</span>
                                Last edited {design.edited || 'Unknown'}
                            </p>
                        </div>
                    </div>
                </Card.Body>
            </Card>
            <DeleteConfirmationModal
                show={deleteModal.show}
                onHide={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                type="map"
                itemName={design.title || 'Untitled Map'}
                additionalInfo={{
                    isDestructive: true,
                    warningText: "This will permanently delete all panoramas, hotspots, tasks, quizzes, and missions associated with this map."
                }}
                loading={deleteModal.loading}
            />
        </Col>
    );
};

export default MapCardHomePage;
