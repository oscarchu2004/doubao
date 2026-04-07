import React, { useState, useEffect } from 'react';
import { Modal, Button, Carousel } from 'react-bootstrap';
import axios from 'axios';
import { baseURL } from '../../utils/baseUrl';
// import './HotspotStyles.css';

const TaskDetail = ({ show, onHide, task, onTaskComplete }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [localCompletionStatus, setLocalCompletionStatus] = useState(false);
    const [hasReachedLastPage, setHasReachedLastPage] = useState(false);

    // Reset states when a new task is shown
    useEffect(() => {
        if (show && task) {
            setActiveIndex(0);
            setHasReachedLastPage(false);
            setLocalCompletionStatus(task.isCompleted || false);
        }
    }, [show, task]);

    // Handle auto-completion when user reaches the last page
    useEffect(() => {
        // Only proceed if task exists and has details
        if (!task || !task.details || task.details.length === 0) return;

        // Check if we've reached the last page and haven't already auto-completed
        const isLastPage = activeIndex === task.details.length - 1;

        if (isLastPage && !hasReachedLastPage && !localCompletionStatus) {
            setHasReachedLastPage(true);

            handleTaskComplete();
        }
    }, [activeIndex, task, hasReachedLastPage, localCompletionStatus]);

    const handleTaskComplete = () => {
        if (!task || localCompletionStatus) return;

        setLoading(true);
        axios.put(`${baseURL}/tasks/complete/${task._id}`, {
            isCompleted: true
        }, { withCredentials: true })
            .then(response => {
                // Update local state first
                setLocalCompletionStatus(true);

                // Notify parent component about the completion
                if (onTaskComplete) {
                    onTaskComplete(task._id);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error completing task:', err);
                setError('Failed to mark task as complete');
                setLoading(false);
            });
    };

    // Handle carousel navigation
    const handleNext = () => {
        if (activeIndex < (task.details?.length - 1 || 0)) {
            setActiveIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        }
    };

    if (!task) return null;

    const isCompleted = localCompletionStatus || task.isCompleted;
    const hasDetails = task.details && task.details.length > 0;
    const isLastPage = hasDetails && activeIndex === task.details.length - 1;

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="lg"
            className="task-detail-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center">
                    {task.title}
                    {isCompleted && (
                        <span className="ms-2 badge bg-success">Completed</span>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Marking task as complete...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : (
                    <>
                        <p className="lead">{task.description}</p>

                        {hasDetails ? (
                            <>
                                <div className="detail-navigation mb-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">
                                            Step {activeIndex + 1} of {task.details.length}
                                            {isLastPage && (
                                                <span className="ms-2 badge bg-success">Completed</span>
                                            )}
                                        </span>
                                        <div>
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                disabled={activeIndex === 0}
                                                onClick={handlePrevious}
                                                className="me-2"
                                            >
                                                <i className="bi bi-chevron-left"></i> Previous
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                disabled={activeIndex === task.details.length - 1}
                                                onClick={handleNext}
                                            >
                                                Next <i className="bi bi-chevron-right"></i>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="progress mt-2" style={{ height: "6px" }}>
                                        <div
                                            className={`progress-bar ${isCompleted ? 'bg-success' : 'bg-info'}`}
                                            role="progressbar"
                                            style={{
                                                width: `${((activeIndex + 1) / task.details.length) * 100}%`
                                            }}
                                            aria-valuenow={(activeIndex + 1) / task.details.length * 100}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        ></div>
                                    </div>
                                </div>

                                <Carousel
                                    activeIndex={activeIndex}
                                    onSelect={setActiveIndex}
                                    interval={null}
                                    indicators={false}
                                    controls={false}
                                    className="task-details-carousel"
                                >
                                    {task.details.map((detail, index) => (
                                        <Carousel.Item key={index}>
                                            <div className="detail-card card">
                                                <div className="card-body">
                                                    <p className="card-text">{detail.text}</p>

                                                    <div className="detail-media mt-3">
                                                        {detail.imagePath && (
                                                            <img
                                                                src={detail.imagePath}
                                                                alt={`Detail ${index + 1}`}
                                                                className="img-fluid rounded mb-3"
                                                            />
                                                        )}

                                                        {detail.videoUrl && (
                                                            <div className="ratio ratio-16x9">
                                                                <iframe
                                                                    src={detail.videoUrl}
                                                                    title={`Video for detail ${index + 1}`}
                                                                    allowFullScreen
                                                                ></iframe>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Carousel.Item>
                                    ))}
                                </Carousel>
                            </>
                        ) : (
                            <div className="alert alert-info">
                                No additional details available for this task.
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default TaskDetail;