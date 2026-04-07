import React, { useState, useEffect } from 'react';
import { Offcanvas, ListGroup, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { baseURL } from '../../utils/baseUrl';
import DeleteConfirmationModal from '../DeleteConfirmationModal/DeleteConfirmationModal';

const MissionPanel = ({ show, handleClose, mapId, isEditMode }) => {
    const [missions, setMissions] = useState([]);
    const [tasksWithoutMission, setTasksWithoutMission] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // delete confirmation state
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        type: null, // 'mission' or 'task'
        item: null,
        loading: false
    });

    // fetch missions and tasks from API using single endpoint
    useEffect(() => {
        const fetchMissionsAndTasks = async () => {
            try {
                if (!mapId) {
                    setError('Map ID not provided');
                    setLoading(false);
                    return;
                }

                setLoading(true);
                setError(null);

                // single API call to get missions with tasks already grouped
                const response = await axios.get(`${baseURL}/tasks/map/${mapId}/grouped`, {
                    withCredentials: true
                });

                setMissions(response.data.missions || []);
                setTasksWithoutMission(response.data.tasksWithoutMission || []);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching missions and tasks:', err);
                setError('Failed to load missions and tasks');
                setLoading(false);
            }
        };

        if (show && mapId) {
            fetchMissionsAndTasks();
        }
    }, [show, mapId]);

    const handleDeleteClick = (type, item) => {
        setDeleteModal({
            show: true,
            type,
            item,
            loading: false
        });
    };

    const handleDeleteConfirm = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            const { type, item } = deleteModal;

            if (type === 'mission') {
                // delete the mission (backend will handle cascade deletion of tasks and hotspots)
                await axios.delete(`${baseURL}/missions/delete/${item._id}`, {
                    withCredentials: true
                });

                // update local state
                setMissions(prev => prev.filter(m => m._id !== item._id));

            } else if (type === 'task') {
                // delete the task (and associated hotspot via backend)
                await axios.delete(`${baseURL}/tasks/delete/${item._id}`, {
                    withCredentials: true
                });

                // update local state
                if (item.missionId) {
                    // task is part of a mission
                    setMissions(prev => prev.map(mission => {
                        if (mission._id === item.missionId) {
                            return {
                                ...mission,
                                tasks: mission.tasks.filter(t => t._id !== item._id)
                            };
                        }
                        return mission;
                    }));
                } else {
                    // task without mission
                    setTasksWithoutMission(prev => prev.filter(t => t._id !== item._id));
                }
            }

            setDeleteModal({ show: false, type: null, item: null, loading: false });

        } catch (err) {
            console.error('Error deleting:', err);
            setError(`Failed to delete ${deleteModal.type}`);
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ show: false, type: null, item: null, loading: false });
    };

    if (loading) {
        return (
            <Offcanvas show={show} onHide={handleClose} placement="end" backdrop={false}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Missions</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <div className="text-center py-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading missions...</p>
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        );
    }

    if (error) {
        return (
            <Offcanvas show={show} onHide={handleClose} placement="end" backdrop={false}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Missions</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                </Offcanvas.Body>
            </Offcanvas>
        );
    }

    return (
        <>
            <Offcanvas show={show} onHide={handleClose} placement="end" backdrop={false}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Missions</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {missions.length === 0 && tasksWithoutMission.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            <i className="bi bi-clipboard-x display-4 mb-3"></i>
                            <p>No missions or tasks available</p>
                        </div>
                    ) : (
                        <>
                            {/* Missions with tasks */}
                            {missions.map(mission => (
                                <div key={mission._id} className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                                        <h5 className="mb-0">
                                            {mission.title}
                                            <small className="ms-2 text-muted">
                                                ({mission.tasks?.filter(t => t.isCompleted).length || 0}/{mission.tasks?.length || 0})
                                            </small>
                                        </h5>
                                        {isEditMode && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteClick('mission', mission)}
                                                className="d-flex align-items-center"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        )}
                                    </div>

                                    {mission.description && (
                                        <p className="text-muted small mb-3">{mission.description}</p>
                                    )}

                                    {mission.tasks && mission.tasks.length > 0 ? (
                                        <ListGroup variant="flush">
                                            {mission.tasks.map(task => (
                                                <ListGroup.Item
                                                    key={task._id}
                                                    className={task.isCompleted ? 'bg-light' : ''}
                                                    style={{
                                                        borderLeft: task.isCompleted ? '3px solid #28a745' : '3px solid transparent',
                                                        transition: 'background-color 0.3s, border-left 0.3s'
                                                    }}
                                                >
                                                    <div className="d-flex align-items-start justify-content-between">
                                                        <div className="d-flex align-items-start flex-grow-1">
                                                            <Form.Check
                                                                type="checkbox"
                                                                id={`task-${task._id}`}
                                                                checked={task.isCompleted}
                                                                disabled={true}
                                                                className="mt-1 me-2"
                                                                label=""
                                                            />
                                                            <div className="flex-grow-1">
                                                                <strong>{task.title}</strong>
                                                                {task.description && (
                                                                    <p className="mb-1 text-muted small">{task.description}</p>
                                                                )}
                                                                {task.isCompleted && (
                                                                    <small className="text-success">
                                                                        <i className="bi bi-check-circle me-1"></i>
                                                                        Completed
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isEditMode && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDeleteClick('task', { ...task, missionId: mission._id })}
                                                                className="ms-2"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <div className="text-center text-muted py-3">
                                            <small>No tasks in this mission</small>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Tasks without mission */}
                            {tasksWithoutMission.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="border-bottom pb-2 mb-3">
                                        Other Tasks
                                        <small className="ms-2 text-muted">
                                            ({tasksWithoutMission.filter(t => t.isCompleted).length}/{tasksWithoutMission.length})
                                        </small>
                                    </h5>

                                    <ListGroup variant="flush">
                                        {tasksWithoutMission.map(task => (
                                            <ListGroup.Item
                                                key={task._id}
                                                className={task.isCompleted ? 'bg-light' : ''}
                                                style={{
                                                    borderLeft: task.isCompleted ? '3px solid #28a745' : '3px solid transparent',
                                                    transition: 'background-color 0.3s, border-left 0.3s'
                                                }}
                                            >
                                                <div className="d-flex align-items-start justify-content-between">
                                                    <div className="d-flex align-items-start flex-grow-1">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`task-no-mission-${task._id}`}
                                                            checked={task.isCompleted}
                                                            disabled={true}
                                                            className="mt-1 me-2"
                                                            label=""
                                                        />
                                                        <div className="flex-grow-1">
                                                            <strong>{task.title}</strong>
                                                            {task.description && (
                                                                <p className="mb-1 text-muted small">{task.description}</p>
                                                            )}
                                                            {task.isCompleted && (
                                                                <small className="text-success">
                                                                    <i className="bi bi-check-circle me-1"></i>
                                                                    Completed
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isEditMode && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteClick('task', task)}
                                                            className="ms-2"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    )}
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}
                        </>
                    )}
                </Offcanvas.Body>
            </Offcanvas>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={deleteModal.show}
                onHide={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                type={deleteModal.type}
                itemName={deleteModal.item?.title}
                additionalInfo={deleteModal.type === 'mission' ? {
                    taskCount: deleteModal.item?.tasks?.length || 0
                } : null}
                loading={deleteModal.loading}
            />
        </>
    );
};

export default MissionPanel;