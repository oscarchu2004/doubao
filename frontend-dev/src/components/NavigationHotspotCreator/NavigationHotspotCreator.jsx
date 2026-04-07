import React, { useState, useEffect } from 'react';
import { Modal, Tab, Tabs, Form, Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './NavigationHotspotCreator.css';
import { baseURL } from '../../utils/baseUrl';
import PanoramaEmptyState from '../PanoramaEmptyState/PanoramaEmptyState';
import DeleteConfirmationModal from '../DeleteConfirmationModal/DeleteConfirmationModal';

const NavigationHotspotCreator = ({
    show = false,
    onHide = () => { },
    mapId,
    minimapPath,
    panoramaId,
    position,
    onHotspotCreated = () => { }
}) => {
    const [activeTab, setActiveTab] = useState('existing');
    const [existingPanoramas, setExistingPanoramas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [creating, setCreating] = useState(false);

    //
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        item: null,
        loading: false
    });

    // Hotspot form state
    const [hotspotForm, setHotspotForm] = useState({
        title: 'Navigation Point',
        targetPanoramaId: '',
        targetInitialView: { yaw: 0, pitch: 0, hfov: 125 },
        requiresChallenge: false,
        challengeQuizId: ''
    });

    // Challenge state
    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);

    // Fetch existing panoramas when modal opens
    useEffect(() => {
        if (show && mapId) {
            fetchExistingPanoramas();
        }
        if (show) {
            setActiveTab('existing');
            resetForm();
        }
    }, [show, mapId]);

    // Fetch quizzes when requires challenge is enabled
    useEffect(() => {
        if (hotspotForm.requiresChallenge && mapId) {
            fetchQuizzes();
        }
    }, [hotspotForm.requiresChallenge, mapId]);

    const resetForm = () => {
        setHotspotForm({
            title: 'Navigation Point',
            targetPanoramaId: '',
            targetInitialView: { yaw: 0, pitch: 0, hfov: 125 },
            requiresChallenge: false,
            challengeQuizId: ''
        });
        setError(null);
    };

    const fetchExistingPanoramas = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(
                `${baseURL}/panoramas/map/${mapId}`,
                { withCredentials: true }
            );

            // Filter out current panorama from list
            const panoramas = response.data.panoramas || [];
            const filteredPanoramas = panoramas.filter(p => p._id !== panoramaId);
            setExistingPanoramas(filteredPanoramas);
        } catch (error) {
            console.error('Error fetching panoramas:', error);
            setError('Failed to load existing panoramas');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuizzes = async () => {
        try {
            setLoadingQuizzes(true);
            const response = await axios.get(
                `${baseURL}/quiz/map/${mapId}`,
                { withCredentials: true }
            );
            setQuizzes(response.data.quizzes || []);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            setError('Failed to load quizzes');
        } finally {
            setLoadingQuizzes(false);
        }
    };

    const handleFormChange = (field, value) => {
        setHotspotForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRequiresChallengeChange = (checked) => {
        setHotspotForm(prev => ({
            ...prev,
            requiresChallenge: checked,
            challengeQuizId: checked ? prev.challengeQuizId : ''
        }));
    };

    const handleSelectExisting = (panorama) => {
        setHotspotForm(prev => ({
            ...prev,
            targetPanoramaId: panorama._id
        }));
    };

    // Handle tab changes and refresh data when switching to existing
    const handleTabSelect = (tabKey) => {
        setActiveTab(tabKey);

        // Refresh existing panoramas when switching to existing tab
        if (tabKey === 'existing' && mapId) {
            fetchExistingPanoramas();
        }
    };

    const handleDeleteClick = (panorama) => {
        setDeleteModal({
            show: true,
            item: panorama,
            loading: false
        });
    };

    const handleDeleteCancel = () => {
        setDeleteModal({
            show: false,
            item: null,
            loading: false
        });
    };

    const handleDeleteConfirm = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            await axios.delete(
                `${baseURL}/panoramas/delete/${deleteModal.item._id}`,
                { withCredentials: true }
            );
            // refresh the panorama list
            fetchExistingPanoramas();
            handleDeleteCancel();
        } catch (error) {
            console.error('Error deleting panorama:', error);
            setError('Failed to delete panorama');
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const createNavigationHotspot = async () => {
        try {
            setCreating(true);
            setError(null);

            // Validate required fields
            if (!hotspotForm.title.trim()) {
                setError('Title is required');
                return;
            }

            if (!hotspotForm.targetPanoramaId) {
                setError('Please select a target panorama');
                return;
            }

            if (!position) {
                setError('Position is required');
                return;
            }

            // Validate challenge requirements
            if (hotspotForm.requiresChallenge && !hotspotForm.challengeQuizId) {
                setError('Please select a challenge quiz');
                return;
            }

            const hotspotData = {
                panoramaId,
                title: hotspotForm.title.trim(),
                position,
                type: 'navigation',
                targetPanoramaId: hotspotForm.targetPanoramaId,
                targetInitialView: hotspotForm.targetInitialView,
                label: 'Navigation',
                icon: 'navigation',
                isVisible: true,
                requiresChallenge: hotspotForm.requiresChallenge,
                ...(hotspotForm.requiresChallenge && hotspotForm.challengeQuizId && {
                    challengeQuizId: hotspotForm.challengeQuizId
                })
            };

            console.log('Creating navigation hotspot with data:', hotspotData);

            const response = await axios.post(
                `${baseURL}/hotspots/create`,
                hotspotData,
                { withCredentials: true }
            );

            console.log('Navigation hotspot created successfully:', response.data);

            // Notify parent
            if (onHotspotCreated) {
                onHotspotCreated(response.data.hotspot);
            }

        } catch (error) {
            console.error('Error creating navigation hotspot:', error);
            setError(error.response?.data?.error || 'Failed to create navigation hotspot');
        } finally {
            setCreating(false);
        }
    };

    const handleClose = () => {
        resetForm();
        if (onHide) {
            onHide();
        }
    };

    const getUploadTabContent = () => {
        const challengeInfo = hotspotForm.requiresChallenge && hotspotForm.challengeQuizId ? (
            <div className="challenge-info">
                <div className="text-success">
                    <i className="bi bi-shield-check me-2"></i>
                    <strong>Challenge:</strong> {quizzes.find(q => q._id === hotspotForm.challengeQuizId)?.title}
                </div>
            </div>
        ) : null;

        return (
            <div>
                {challengeInfo}
                <PanoramaEmptyState
                    mapId={mapId}
                    minimapPath={minimapPath}
                    isEditMode={!hotspotForm.requiresChallenge || hotspotForm.challengeQuizId}
                    height="300px"
                    title="Upload New Panorama"
                    description="Add a new panoramic image as the target for this navigation hotspot"
                />
            </div>
        );
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="lg"
            centered
            backdrop="static"
            className="navigation-hotspot-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-signpost-2 me-2"></i>
                    Create Navigation Hotspot
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Position Info */}
                {position && (
                    <Alert variant="info" className="position-info mb-3">
                        <div className="d-flex align-items-center">
                            <i className="bi bi-geo-alt me-2"></i>
                            <div>
                                <strong>Hotspot Position:</strong>
                                <span className="ms-2">
                                    Yaw: {position.yaw.toFixed(2)}°, Pitch: {position.pitch.toFixed(2)}°
                                </span>
                            </div>
                        </div>
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger" className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => setError(null)}
                            >
                                <i className="bi bi-x"></i>
                            </Button>
                        </div>
                    </Alert>
                )}

                {/* Hotspot Configuration */}
                <Card className="mb-3">
                    <Card.Header>
                        <h6 className="mb-0">
                            <i className="bi bi-gear me-2"></i>
                            Hotspot Configuration
                        </h6>
                    </Card.Header>
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Hotspot Title</Form.Label>
                            <Form.Control
                                type="text"
                                className="input-field"
                                value={hotspotForm.title}
                                onChange={(e) => handleFormChange('title', e.target.value)}
                                placeholder="Enter hotspot title"
                            />
                        </Form.Group>

                        {/* Challenge Configuration */}
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                id="requires-challenge"
                                label="Requires Challenge"
                                checked={hotspotForm.requiresChallenge}
                                onChange={(e) => handleRequiresChallengeChange(e.target.checked)}
                            />
                            <Form.Text className="text-muted">
                                Enable this to require users to complete a quiz before accessing this panorama
                            </Form.Text>
                        </Form.Group>

                        {hotspotForm.requiresChallenge && (
                            <Form.Group className="mb-0">
                                <Form.Label>Select Challenge Quiz</Form.Label>
                                {loadingQuizzes ? (
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                        <small className="text-muted d-block">Loading quizzes...</small>
                                    </div>
                                ) : quizzes.length === 0 ? (
                                    <Alert variant="warning" className="mb-0">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        No quizzes found for this map. Create a quiz first to enable challenges.
                                    </Alert>
                                ) : (
                                    <Form.Select
                                        value={hotspotForm.challengeQuizId}
                                        onChange={(e) => handleFormChange('challengeQuizId', e.target.value)}
                                        required={hotspotForm.requiresChallenge}
                                    >
                                        <option value="">Select a quiz...</option>
                                        {quizzes.map(quiz => (
                                            <option key={quiz._id} value={quiz._id}>
                                                {quiz.title}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>
                        )}
                    </Card.Body>
                </Card>

                {/* Target Panorama Selection */}
                <Card className="mb-3">
                    <Card.Header>
                        <h6 className="mb-0">
                            <i className="bi bi-images me-2"></i>
                            Select Target Panorama
                        </h6>
                    </Card.Header>
                    <Card.Body>
                        <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-3">
                            <Tab eventKey="existing" title={
                                <span>
                                    <i className="bi bi-collection me-2"></i>
                                    Select Existing ({existingPanoramas.length})
                                </span>
                            }>
                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" className="mb-3" />
                                        <p className="text-muted">Loading panoramas...</p>
                                    </div>
                                ) : existingPanoramas.length === 0 ? (
                                    <Alert variant="info" className="text-center">
                                        <i className="bi bi-info-circle me-2"></i>
                                        No other panoramas found in this map. Upload a new panorama using the 'Upload New' tab!
                                    </Alert>
                                ) : (
                                    <Row>
                                        {existingPanoramas.map(panorama => (
                                            <Col md={6} key={panorama._id} className="mb-3">
                                                <Card
                                                    className={`h-100 panorama-selector-card ${hotspotForm.targetPanoramaId === panorama._id ? 'border-primary' : ''
                                                        } ${hotspotForm.requiresChallenge && !hotspotForm.challengeQuizId ? 'disabled' : ''}`}
                                                    style={{
                                                        cursor: hotspotForm.requiresChallenge && !hotspotForm.challengeQuizId ? 'not-allowed' : 'pointer',
                                                        position: 'relative'
                                                    }}
                                                    onClick={() => {
                                                        if (!hotspotForm.requiresChallenge || hotspotForm.challengeQuizId) {
                                                            handleSelectExisting(panorama);
                                                        }
                                                    }}
                                                >
                                                    <Button
                                                        className="delete-btn position-absolute"
                                                        style={{
                                                            top: '8px',
                                                            right: '8px',
                                                            zIndex: 10
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(panorama);
                                                        }}
                                                    >
                                                        <i className="bi bi-trash" style={{ fontSize: '14px' }}></i>
                                                    </Button>
                                                    <Card.Img
                                                        variant="top"
                                                        src={panorama.imagePath}
                                                        style={{
                                                            height: '120px',
                                                            objectFit: 'cover',
                                                            backgroundColor: '#f8f9fa'
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            height: '120px',
                                                            display: 'none',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: '#f8f9fa',
                                                            color: '#6c757d'
                                                        }}
                                                    >
                                                        <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
                                                    </div>
                                                    <Card.Body className="p-3">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <Card.Title className="h6 mb-1">
                                                                    {panorama.title || 'Untitled Panorama'}
                                                                </Card.Title>
                                                                {panorama.description && (
                                                                    <Card.Text className="text-muted small mb-2">
                                                                        {panorama.description}
                                                                    </Card.Text>
                                                                )}
                                                            </div>
                                                            {hotspotForm.targetPanoramaId === panorama._id && (
                                                                <i className="bi bi-check-circle-fill text-primary"></i>
                                                            )}
                                                        </div>
                                                        {hotspotForm.requiresChallenge && hotspotForm.challengeQuizId && (
                                                            <div className="text-success small mt-2">
                                                                <i className="bi bi-shield-check me-1"></i>
                                                                Challenge: {quizzes.find(q => q._id === hotspotForm.challengeQuizId)?.title}
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Tab>

                            <Tab eventKey="upload" title={
                                <span>
                                    <i className="bi bi-cloud-upload me-2"></i>
                                    Upload New
                                </span>
                            }>
                                {getUploadTabContent()}
                            </Tab>
                        </Tabs>
                    </Card.Body>
                </Card>
            </Modal.Body>

            <Modal.Footer className="d-block">

                <div className='mb-1 mt-3'>
                    <button
                        type='submit'

                        className="create-hotspot-btn mb-1 btn btn-lg btn-primary w-100 fs-6"
                        onClick={createNavigationHotspot}
                        disabled={
                            creating ||
                            !hotspotForm.title.trim() ||
                            !hotspotForm.targetPanoramaId ||
                            (hotspotForm.requiresChallenge && !hotspotForm.challengeQuizId)
                        }
                    >
                        {creating ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Creating Navigation Hotspot...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-signpost-2 me-2"></i>
                                Create Navigation Hotspot
                            </>
                        )}
                    </button>
                </div>
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

            </Modal.Footer>

            {/* delete confirm modal */}
            <DeleteConfirmationModal
                show={deleteModal.show}
                onHide={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                type="panorama"
                itemName={deleteModal.item?.title || 'Untitled Panorama'}
                additionalInfo={{
                    hasHotspots: true // You can make this dynamic if you have hotspot count
                }}
                loading={deleteModal.loading}
            />
        </Modal>
    );
};

export default NavigationHotspotCreator;