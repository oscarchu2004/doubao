import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, InputGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './NavigationHotspotEditor.css';
import { baseURL } from '../../utils/baseUrl';

const NavigationHotspotEditor = ({ show, onHide, hotspot, onHotspotUpdated }) => {
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        targetInitialView: {
            yaw: 0,
            pitch: 0,
            hfov: 100
        }
    });

    // Initialize form data when hotspot changes
    useEffect(() => {
        if (hotspot) {
            setFormData({
                title: hotspot.title || '',
                targetInitialView: {
                    yaw: hotspot.targetInitialView?.yaw || 0,
                    pitch: hotspot.targetInitialView?.pitch || 0,
                    hfov: hotspot.targetInitialView?.hfov || 100
                }
            });
        }
    }, [hotspot]);

    // Handle form field changes
    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle target initial view changes
    const handleTargetViewChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            targetInitialView: {
                ...prev.targetInitialView,
                [field]: parseFloat(value) || 0
            }
        }));
    };

    // Update hotspot
    const updateHotspot = async () => {
        try {
            setLoading(true);
            setAlert({ show: false, message: '', type: '' });

            // Validate form
            if (!formData.title.trim()) {
                throw new Error('Title is required');
            }

            const updateData = {
                title: formData.title.trim(),
                targetInitialView: formData.targetInitialView
            };

            const response = await axios.put(
                `${baseURL}/hotspots/update/${hotspot._id}`,
                updateData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                setAlert({
                    show: true,
                    message: 'Navigation hotspot updated successfully!',
                    type: 'success'
                });

                // notify parent component
                if (onHotspotUpdated) {
                    onHotspotUpdated(response.data.hotspot);
                }

                // close modal after delay
                setTimeout(() => {
                    onHide();
                }, 1500);
            }

        } catch (error) {
            console.error('Error updating hotspot:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to update hotspot';
            setAlert({
                show: true,
                message: errorMessage,
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!show) {
            setAlert({ show: false, message: '', type: '' });
        }
    }, [show]);

    if (!hotspot) return null;

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="sm"
            className="navigation-hotspot-editor-modal"
            backdrop="static"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-signpost-2 me-2 text-primary"></i>
                    Edit Navigation Hotspot
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {alert.show && (
                    <Alert variant={alert.type} className={`navigation-editor-alert alert-${alert.type}`}>
                        <i className={`bi ${alert.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                        {alert.message}
                    </Alert>
                )}

                <Form className="navigation-editor-form">
                    {/* Title */}
                    <Form.Group className="mb-3">
                        <Form.Label>Hotspot Title</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleFormChange('title', e.target.value)}
                            placeholder="Enter hotspot title"
                        />
                    </Form.Group>

                    {/* Target Initial View */}
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Target View Settings
                            <small className="text-muted ms-2">(Where users will look when arriving)</small>
                        </Form.Label>

                        {/* Yaw (Horizontal) */}
                        <Row className="mb-2">
                            <Col xs={4}>
                                <Form.Label className="view-setting-label">Yaw</Form.Label>
                            </Col>
                            <Col xs={8}>
                                <Form.Control
                                    type="number"
                                    value={formData.targetInitialView.yaw}
                                    onChange={(e) => handleTargetViewChange('yaw', e.target.value)}
                                    min="-180"
                                    max="180"
                                    step="0.1"
                                    className="text-end"
                                />
                            </Col>
                        </Row>

                        {/* Pitch (Vertical) */}
                        <Row className="mb-2">
                            <Col xs={4}>
                                <Form.Label className="view-setting-label">Pitch</Form.Label>
                            </Col>
                            <Col xs={8}>
                                <Form.Control
                                    type="number"
                                    value={formData.targetInitialView.pitch}
                                    onChange={(e) => handleTargetViewChange('pitch', e.target.value)}
                                    min="-90"
                                    max="90"
                                    step="0.1"
                                    className="text-end"
                                />
                            </Col>
                        </Row>

                        {/* HFOV (Field of View) */}
                        <Row className="mb-0">
                            <Col xs={4}>
                                <Form.Label className="view-setting-label">HFOV</Form.Label>
                            </Col>
                            <Col xs={8}>
                                <Form.Control
                                    type="number"
                                    value={formData.targetInitialView.hfov}
                                    onChange={(e) => handleTargetViewChange('hfov', e.target.value)}
                                    min="30"
                                    max="120"
                                    step="1"
                                    className="text-end"
                                />
                            </Col>
                        </Row>
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer className="d-block">
                <div className="d-flex flex-column w-100">
                    <Button
                        className="navigation-update-btn w-100 mb-0"
                        onClick={updateHotspot}
                        disabled={loading || !formData.title.trim()}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check me-2"></i>
                                Update
                            </>
                        )}
                    </Button>

                    {/* "or" separator line */}
                    <div
                        className="mb-1"
                        style={{
                            width: '100%',
                            height: '15px',
                            borderBottom: '0.5px solid #8E8D8D',
                            textAlign: 'center'
                        }}
                    >
                        <span
                            style={{
                                fontSize: '13px',
                                color: '#8E8D8D',
                                backgroundColor: 'white',
                                padding: '0 5px'
                            }}
                        >
                            or
                        </span>
                    </div>

                    <Button
                        className="navigation-cancel-btn w-100 mt-2" 
                        onClick={onHide}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default NavigationHotspotEditor;