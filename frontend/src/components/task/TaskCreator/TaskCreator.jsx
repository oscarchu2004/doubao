import React, { useState, useEffect } from 'react';
import { Modal, Button, Nav, Tab, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';
import { baseURL } from '../../../utils/baseUrl';
import './TaskCreator.css';

const TaskCreator = ({
    mapId,
    panoramaId, // Add panoramaId prop for hotspot creation
    position, // Position for hotspot placement
    show = false,
    onHide = () => { },
    onTaskCreated = () => { },
    title = "Create Task"
}) => {
    const [showModal, setShowModal] = useState(show);
    const [activeTab, setActiveTab] = useState('create-task');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [draggedDetailIndex, setDraggedDetailIndex] = useState(null);

    // Mission-related state
    const [missions, setMissions] = useState([]);
    const [loadingMissions, setLoadingMissions] = useState(false);

    // Challenge-related state
    const [requiresChallenge, setRequiresChallenge] = useState(false);
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [loadingQuizzes, setLoadingQuizzes] = useState(false);

    // Upload states
    const [uploading, setUploading] = useState(false);

    // Task form state
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        details: [{ order: 1, text: '', imagePath: '', videoUrl: '' }],
        missionId: '', // empty means standalone
        withMission: false
    });

    // Mission form state
    const [missionForm, setMissionForm] = useState({
        title: '',
        description: '',
        order: '',
        isSequential: true
    });

    // Update modal visibility when prop changes
    useEffect(() => {
        setShowModal(show);
    }, [show]);

    // Fetch missions when modal opens
    useEffect(() => {
        if (showModal && mapId) {
            fetchMissions();
        }
        if (showModal) {
            setActiveTab('create-task');
            resetForms();
        }
    }, [showModal, mapId]);

    // Fetch quizzes when requires challenge is enabled
    useEffect(() => {
        if (requiresChallenge && mapId) {
            fetchQuizzes();
        }
    }, [requiresChallenge, mapId]);

    const fetchMissions = async () => {
        try {
            setLoadingMissions(true);
            const response = await axios.get(
                `${baseURL}/missions/${mapId}`,
                { withCredentials: true }
            );
            setMissions(response.data.missions || []);
        } catch (error) {
            console.error('Error fetching missions:', error);
            setError('Failed to load missions');
        } finally {
            setLoadingMissions(false);
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

    const resetForms = () => {
        setTaskForm({
            title: '',
            description: '',
            details: [{ order: 1, text: '', imagePath: '', videoUrl: '' }],
            missionId: '',
            withMission: false
        });
        setMissionForm({
            title: '',
            description: '',
            order: '',
            isSequential: true
        });
        setRequiresChallenge(false);
        setSelectedQuizId('');
        setError(null);
        setSuccess(null);
        setDraggedDetailIndex(null);
    };

    const handleClose = () => {
        setShowModal(false);
        resetForms();
        if (onHide) {
            onHide();
        }
    };

    const handleRequiresChallengeChange = (checked) => {
        setRequiresChallenge(checked);
        if (!checked) {
            setSelectedQuizId('');
        }
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

    // Task form handlers
    const handleTaskFormChange = (field, value) => {
        setTaskForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDetailChange = (index, field, value) => {
        setTaskForm(prev => ({
            ...prev,
            details: prev.details.map((detail, i) =>
                i === index ? {
                    ...detail,
                    [field]: value
                } : detail
            )
        }));
    };

    // Handle image upload to Cloudinary
    const handleImageUpload = async (event, index) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setError(null);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image file must be less than 5MB');
                return;
            }

            // Upload to S3
            const uploadedImageUrl = await uploadToS3(file);

            console.log('Image uploaded to S3:', uploadedImageUrl);

            // Update the detail with the uploaded URL
            handleDetailChange(index, 'imagePath', uploadedImageUrl);

            // Clear the file input to allow re-selection
            event.target.value = '';

            // Show success message briefly
            setSuccess('Image uploaded successfully!');
            setTimeout(() => {
                setSuccess(null);
            }, 2000);

        } catch (error) {
            console.error('Image upload error:', error);
            setError(error.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const addDetail = () => {
        setTaskForm(prev => ({
            ...prev,
            details: [...prev.details, {
                order: prev.details.length + 1,
                text: '',
                imagePath: '',
                videoUrl: ''
            }]
        }));
    };

    const removeDetail = (index) => {
        if (taskForm.details.length > 1) {
            const updatedDetails = taskForm.details.filter((_, i) => i !== index);
            // Re-order remaining details
            const reorderedDetails = updatedDetails.map((detail, i) => ({
                ...detail,
                order: i + 1
            }));

            setTaskForm(prev => ({
                ...prev,
                details: reorderedDetails
            }));
        }
    };

    // Remove image from detail
    const removeImage = (index) => {
        handleDetailChange(index, 'imagePath', '');
    };

    // Drag and drop functionality for task details
    const handleDetailDragStart = (e, index) => {
        setDraggedDetailIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDetailDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDetailDrop = (e, dropIndex) => {
        e.preventDefault();

        if (draggedDetailIndex === null || draggedDetailIndex === dropIndex) return;

        const draggedDetail = taskForm.details[draggedDetailIndex];
        const updatedDetails = [...taskForm.details];

        // Remove dragged item
        updatedDetails.splice(draggedDetailIndex, 1);

        // Insert at new position
        updatedDetails.splice(dropIndex, 0, draggedDetail);

        // Update order numbers
        const reorderedDetails = updatedDetails.map((detail, i) => ({
            ...detail,
            order: i + 1
        }));

        setTaskForm(prev => ({
            ...prev,
            details: reorderedDetails
        }));

        setDraggedDetailIndex(null);
    };

    // Mission form handlers
    const handleMissionFormChange = (field, value) => {
        setMissionForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const createMission = async () => {
        try {
            setLoading(true);
            setError(null);

            const missionData = {
                mapId,
                title: missionForm.title,
                description: missionForm.description,
                isSequential: missionForm.isSequential
            };

            // Only include order if provided
            if (missionForm.order && missionForm.order.trim() !== '') {
                missionData.order = parseInt(missionForm.order);
            }

            const response = await axios.post(
                `${baseURL}/missions/create`,
                missionData,
                { withCredentials: true }
            );

            setSuccess('Mission created successfully!');
            await fetchMissions(); // Refresh missions list

            // Switch to task creation tab with new mission selected
            setTaskForm(prev => ({
                ...prev,
                missionId: response.data.mission._id,
                withMission: true
            }));
            setActiveTab('create-task');

        } catch (error) {
            console.error('Error creating mission:', error);
            setError(error.response?.data?.error || 'Failed to create mission');
        } finally {
            setLoading(false);
        }
    };

    const createTask = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            if (!taskForm.title.trim()) {
                setError('Title is required');
                return;
            }

            if (!position) {
                setError('Position is required');
                return;
            }

            if (!panoramaId) {
                setError('Panorama ID is required');
                return;
            }

            // Validate challenge requirements
            if (requiresChallenge && !selectedQuizId) {
                setError('Please select a challenge quiz');
                return;
            }

            // Filter out empty details and clean up the data
            const cleanDetails = taskForm.details
                .filter(detail => detail.text.trim() !== '')
                .map((detail, index) => ({
                    order: detail.order || index + 1,
                    text: detail.text.trim(),
                    ...(detail.imagePath && { imagePath: detail.imagePath.trim() }),
                    ...(detail.videoUrl && { videoUrl: detail.videoUrl.trim() })
                }));

            // Step 1: Create the task first
            const taskData = {
                title: taskForm.title.trim(),
                description: taskForm.description.trim(),
                details: cleanDetails
            };

            // Add mission if selected
            if (taskForm.withMission && taskForm.missionId) {
                taskData.missionId = taskForm.missionId;
            }

            console.log('Creating task with data:', taskData);

            const taskResponse = await axios.post(
                `${baseURL}/tasks/create`,
                taskData,
                { withCredentials: true }
            );

            const taskId = taskResponse.data.task._id;
            console.log('Task created with ID:', taskId);

            // Step 2: Create the hotspot with the taskId
            const hotspotData = {
                panoramaId,
                title: taskForm.title || 'Task Point',
                position,
                type: 'task',
                taskId: taskId,
                isVisible: true,
                requiresChallenge,
                ...(requiresChallenge && selectedQuizId && { challengeQuizId: selectedQuizId })
            };

            console.log('Creating task hotspot with data:', hotspotData);

            const hotspotResponse = await axios.post(
                `${baseURL}/hotspots/create`,
                hotspotData,
                { withCredentials: true }
            );

            console.log('Task hotspot created successfully');

            setSuccess('Task and hotspot created successfully!');

            if (onTaskCreated) {
                onTaskCreated(taskResponse.data.task);
            }

            // Close modal after short delay
            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (error) {
            console.error('Error creating task:', error);
            setError(error.response?.data?.error || 'Failed to create task and hotspot');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={showModal}
            onHide={handleClose}
            size="lg"
            centered
            backdrop="static"
            className="task-creator-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Position Info */}
                {position && (
                    <Alert variant="info" className="mb-3">
                        <i className="bi bi-geo-alt me-2"></i>
                        <strong>Position:</strong> Yaw: {position.yaw.toFixed(2)}°, Pitch: {position.pitch.toFixed(2)}°
                    </Alert>
                )}

                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                    <Nav variant="tabs" className="mb-3">
                        <Nav.Item>
                            <Nav.Link eventKey="create-task">
                                <i className="bi bi-check-square me-2"></i>
                                Create Task
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="create-mission">
                                <i className="bi bi-collection me-2"></i>
                                Create Mission
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    {(error || success) && (
                        <Alert variant={error ? "danger" : "success"} className="mb-3 task-creator-alert">
                            <i className={`bi ${error ? 'bi-exclamation-triangle' : 'bi-check-circle'} me-2`}></i>
                            {error || success}
                        </Alert>
                    )}

                    <Tab.Content>
                        {/* Create Task Tab */}
                        <Tab.Pane eventKey="create-task">
                            <Form className="task-creator-form">
                                <Form.Group className="mb-3">
                                    <Form.Label>Task Title *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={taskForm.title}
                                        onChange={(e) => handleTaskFormChange('title', e.target.value)}
                                        placeholder="Enter task title"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={taskForm.description}
                                        onChange={(e) => handleTaskFormChange('description', e.target.value)}
                                        placeholder="Describe what the user needs to do"
                                    />
                                </Form.Group>

                                {/* Mission Selection */}
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="with-mission"
                                        label="Associate with Mission"
                                        checked={taskForm.withMission}
                                        onChange={(e) => handleTaskFormChange('withMission', e.target.checked)}
                                    />
                                    <Form.Text className="text-muted">
                                        Create a new mission in the "Create Mission" tab if needed
                                    </Form.Text>
                                </Form.Group>

                                {taskForm.withMission && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Select Mission</Form.Label>
                                        {loadingMissions ? (
                                            <div className="text-center py-2">
                                                <Spinner animation="border" size="sm" />
                                            </div>
                                        ) : (
                                            <Form.Select
                                                value={taskForm.missionId}
                                                onChange={(e) => handleTaskFormChange('missionId', e.target.value)}
                                            >
                                                <option value="">Select a mission...</option>
                                                {missions.map(mission => (
                                                    <option key={mission._id} value={mission._id}>
                                                        {mission.title}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    </Form.Group>
                                )}

                                {/* Challenge Selection */}
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="requires-challenge"
                                        label="Requires Challenge"
                                        checked={requiresChallenge}
                                        onChange={(e) => handleRequiresChallengeChange(e.target.checked)}
                                    />
                                    <Form.Text className="text-muted">
                                        Enable this to require users to complete a quiz before accessing this task
                                    </Form.Text>
                                </Form.Group>

                                {requiresChallenge && (
                                    <Form.Group className="mb-3">
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
                                                value={selectedQuizId}
                                                onChange={(e) => setSelectedQuizId(e.target.value)}
                                                required={requiresChallenge}
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

                                {/* Task Details with Drag and Drop */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Form.Label className="mb-0">Task Details ({taskForm.details.length})</Form.Label>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={addDetail}
                                        >
                                            <i className="bi bi-plus me-1"></i>
                                            Add Detail
                                        </Button>
                                    </div>

                                    {taskForm.details.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-list-task display-4 mb-3"></i>
                                            <p>No details added yet. Click "Add Detail" to get started.</p>
                                        </div>
                                    ) : (
                                        taskForm.details.map((detail, index) => (
                                            <Card
                                                key={index}
                                                className={`mb-2 task-detail-card ${draggedDetailIndex === index ? 'dragging' : ''}`}
                                                draggable
                                                onDragStart={(e) => handleDetailDragStart(e, index)}
                                                onDragOver={handleDetailDragOver}
                                                onDrop={(e) => handleDetailDrop(e, index)}
                                                style={{
                                                    cursor: 'move',
                                                    opacity: draggedDetailIndex === index ? 0.5 : 1,
                                                    border: draggedDetailIndex === index ? '2px dashed #007bff' : '1px solid #dee2e6'
                                                }}
                                            >
                                                <Card.Body className="p-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div className="d-flex align-items-center">
                                                            <i className="bi bi-grip-vertical me-2 text-muted drag-handle"></i>
                                                            <small className="text-muted">Detail #{detail.order}</small>
                                                        </div>
                                                        {taskForm.details.length > 1 && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => removeDetail(index)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <Form.Group className="mb-2">
                                                        <Form.Label className="small">Text Content *</Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={2}
                                                            size="sm"
                                                            value={detail.text}
                                                            onChange={(e) => handleDetailChange(index, 'text', e.target.value)}
                                                            placeholder="Enter detail text"
                                                        />
                                                    </Form.Group>

                                                    <Row>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-0">
                                                                <Form.Label className="small">Image (Optional)</Form.Label>
                                                                <Form.Control
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleImageUpload(e, index)}
                                                                    className="form-control form-control-lg bg-light fs-6 input-field"
                                                                    disabled={uploading}
                                                                />
                                                                {detail.imagePath && (
                                                                    <div className="mt-2">
                                                                        <img
                                                                            src={detail.imagePath}
                                                                            alt="Task Detail Preview"
                                                                            style={{
                                                                                width: '100%',
                                                                                maxHeight: '150px',
                                                                                objectFit: 'cover',
                                                                                borderRadius: '8px'
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="p-0 text-danger mt-1"
                                                                            onClick={() => removeImage(index)}
                                                                        >
                                                                            <small>Remove Image</small>
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Group className="mb-0">
                                                                <Form.Label className="small">Video URL (Optional)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    size="sm"
                                                                    value={detail.videoUrl}
                                                                    onChange={(e) => handleDetailChange(index, 'videoUrl', e.target.value)}
                                                                    placeholder="https://www.youtube.com/embed/..."
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
                                        ))
                                    )}
                                </div>

                                {/* Challenge Summary */}
                                {requiresChallenge && selectedQuizId && (
                                    <Alert variant="info" className="mb-3">
                                        <i className="bi bi-shield-check me-2"></i>
                                        <strong>Challenge Enabled:</strong> Users must complete "{quizzes.find(q => q._id === selectedQuizId)?.title}" before accessing this task.
                                    </Alert>
                                )}

                                {/* <Modal.Footer className="d-block"> */}
                                <div className='mb-1 mt-3'>
                                    <button
                                        type='submit'

                                        className="create-task-btn mb-1 btn btn-lg btn-primary w-100 fs-6"
                                        onClick={createTask}
                                        disabled={
                                            loading || (requiresChallenge && !selectedQuizId) || !position || !panoramaId
                                        }
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Creating Task...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-signpost-2 me-2"></i>
                                                Create Task
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

                                {/* </Modal.Footer> */}
                            </Form>
                        </Tab.Pane>

                        {/* Create Mission Tab */}
                        <Tab.Pane eventKey="create-mission">
                            <Form className="task-creator-form">
                                <Row>
                                    <Col md={8}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mission Title *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={missionForm.title}
                                                onChange={(e) => handleMissionFormChange('title', e.target.value)}
                                                placeholder="Enter mission title"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Order (Optional)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={missionForm.order}
                                                onChange={(e) => handleMissionFormChange('order', e.target.value)}
                                                placeholder="1, 2, 3..."
                                                min="0"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        value={missionForm.description}
                                        onChange={(e) => handleMissionFormChange('description', e.target.value)}
                                        placeholder="Describe the mission and its objectives"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="is-sequential"
                                        label="Sequential Mission (tasks must be completed in order)"
                                        checked={missionForm.isSequential}
                                        onChange={(e) => handleMissionFormChange('isSequential', e.target.checked)}
                                    />
                                </Form.Group>

                                <div className="d-flex justify-content-end">
                                    <Button
                                        variant="success"
                                        className="task-creator-btn"
                                        onClick={createMission}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Creating Mission...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-circle me-2"></i>
                                                Create Mission
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {missions.length > 0 && (
                                    <div className="mt-4">
                                        <h6>Existing Missions in this Map:</h6>
                                        <div className="list-group">
                                            {missions.map(mission => (
                                                <div key={mission._id} className="list-group-item">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <h6 className="mb-1">{mission.title}</h6>
                                                            <p className="mb-1 text-muted small">{mission.description}</p>
                                                            <small className="text-muted">
                                                                Order: {mission.order || 'Not set'} |
                                                                {mission.isSequential ? ' Sequential' : ' Non-sequential'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Form>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    );
};

export default TaskCreator;
