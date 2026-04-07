import { Button, Modal, Alert } from 'react-bootstrap';

const DeleteConfirmationModal = ({
    show,
    onHide,
    onConfirm,
    type,
    itemName,
    additionalInfo,
    loading
}) => {
    const getTypeConfig = () => {
        switch (type) {
            case 'mission':
                return {
                    title: 'Delete Mission',
                    entityName: 'mission',
                    hasWarning: true,
                    warningContent: additionalInfo && (
                        <Alert variant="warning" className="mb-0">
                            <strong>Warning:</strong> This will also delete:
                            <ul className="mb-0 mt-2">
                                <li>{additionalInfo.taskCount} associated task(s)</li>
                                <li>ALL related hotspots</li>
                                <li>ALL associated content</li>
                            </ul>
                        </Alert>
                    ),
                    infoContent: null
                };

            case 'task':
                return {
                    title: 'Delete Task',
                    entityName: 'task',
                    hasWarning: false,
                    warningContent: null,
                    infoContent: (
                        <Alert variant="info" className="mb-0">
                            This will also delete the associated hotspot.
                        </Alert>
                    )
                };

            case 'quiz':
                return {
                    title: 'Delete Quiz',
                    entityName: 'quiz',
                    hasWarning: false,
                    warningContent: null,
                    infoContent: (
                        <Alert variant="info" className="mb-0">
                            This will delete the quiz and all its questions and answers.
                        </Alert>
                    )
                };

            case 'panorama':
                return {
                    title: 'Delete Panorama',
                    entityName: 'panorama',
                    hasWarning: additionalInfo?.hasHotspots,
                    warningContent: additionalInfo?.hasHotspots && (
                        <Alert variant="warning" className="mb-0">
                            <strong>Warning:</strong> This will also delete:
                            <ul className="mb-0 mt-2">
                                <li>ALL associated hotspots</li>
                                <li>ALL linked tasks and content</li>
                            </ul>
                        </Alert>
                    ),
                    infoContent: !additionalInfo?.hasHotspots && (
                        <Alert variant="info" className="mb-0">
                            This will delete the panorama image and its metadata.
                        </Alert>
                    )
                };

            case 'map':
                return {
                    title: 'Delete Map',
                    entityName: 'map',
                    hasWarning: true,
                    warningContent: additionalInfo && (
                        <Alert variant="danger" className="mb-0">
                            <strong>Critical Warning:</strong> This will permanently delete:
                            <ul className="mb-0 mt-2">
                                <li>{additionalInfo.panoramaCount || "ALL"} panorama(s)</li>
                                <li>{additionalInfo.missionCount || "ALL"} mission(s)</li>
                                <li>{additionalInfo.taskCount || "ALL"} task(s)</li>
                                <li>ALL hotspots and associated content</li>
                            </ul>
                        </Alert>
                    ),
                    infoContent: null
                };

            default:
                return {
                    title: 'Delete Item',
                    entityName: 'item',
                    hasWarning: false,
                    warningContent: null,
                    infoContent: null
                };
        }
    };

    const config = getTypeConfig();

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="d-flex align-items-center text-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {config.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <p className="mb-2">
                        Are you sure you want to delete {config.entityName} <strong>"{itemName}"</strong>?
                    </p>

                    {config.warningContent}
                    {config.infoContent}
                </div>

                <p className="text-muted small mb-0">
                    This action cannot be undone.
                </p>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    disabled={loading}
                    className="d-flex align-items-center"
                >
                    {loading ? (
                        <>
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            Deleting...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-trash me-2"></i>
                            Delete {config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)}
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DeleteConfirmationModal;