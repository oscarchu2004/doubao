import React, { useState, useEffect, useRef } from 'react';
import { Button, Overlay, Popover } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LeftSideBar.css';
import { useNavigate, useParams } from 'react-router-dom';


const LeftSidebar = ({ onCursorChange }) => {
    const [activeTool, setActiveTool] = useState('normal');
    const [showCreateOptions, setShowCreateOptions] = useState(false);
    const [showEditOptions, setShowEditOptions] = useState(false);
    const createButtonRef = useRef(null);
    const editButtonRef = useRef(null);
    const navigate = useNavigate();
    const { mapId } = useParams();    

    // Define cursor tools
    const tools = [
        { id: 'normal', icon: 'bi-cursor', title: 'Normal Cursor' },
        { id: 'create', icon: 'bi-plus-circle', title: 'Create' },
        { id: 'edit', icon: 'bi-pencil', title: 'Edit' },
        { id: 'delete', icon: 'bi-trash', title: 'Delete' }
    ];

    // Define create options
    const createOptions = [
        { id: 'create-navigation', icon: 'bi-signpost-2', title: 'Navigation Hotspots' },
        { id: 'create-task', icon: 'bi-check-square', title: 'Task Hotspots' },
        { id: 'create-quiz', icon: 'bi-question-circle', title: 'Create Quiz' },
	{ id: 'add-panorama', icon: 'bi-plus-circle', title: 'Add Panorama'}
    ];

    // Define edit options
    const editOptions = [
        { id: 'edit-navigation', icon: 'bi-signpost-2', title: 'Edit Navigation Hotspots' }
    ];

    // Handle tool selection
    const handleToolSelect = (toolId) => {
        console.log('Tool selected:', toolId);
        setActiveTool(toolId);

        // Close options when selecting another tool
        if (toolId !== 'create') {
            setShowCreateOptions(false);
        }
        if (toolId !== 'edit') {
            setShowEditOptions(false);
        }

        // Call the provided callback to notify parent components
        if (onCursorChange) {
            onCursorChange(toolId);
        }
    };

    // Handle create option selection
    const handleCreateOptionSelect = (optionId) => {
        console.log('Create option selected:', optionId);

        if (optionId === 'create-quiz') {
            // Existing logic for Quiz
            setShowCreateOptions(false);
            setActiveTool('create-quiz'); // Keep this tool active
    
            if (onCursorChange) {
                onCursorChange('create-quiz'); // This will trigger showQuizCreator in MapViewPage
            }
    } else if (optionId === 'add-panorama') {
            // 🚀 NEW: Navigate to Add Panorama page
            setShowCreateOptions(false);
            // navigate(`/map/${mapId}/panorama/new`);
            setActiveTool('add-panorama');
	
	    if (onCursorChange) {
		onCursorChange('add-panorama');
	    }
    } else {
           // Handle other create options normally
           setActiveTool(optionId);
           setShowCreateOptions(false);
           if (onCursorChange) {
               onCursorChange(optionId);
           }
        }
    };

    // Handle edit option selection
    const handleEditOptionSelect = (optionId) => {
        console.log('Edit option selected:', optionId);
        setActiveTool(optionId);
        setShowEditOptions(false);

        // Call the provided callback to notify parent components
        if (onCursorChange) {
            onCursorChange(optionId);
        }
    };

    // Toggle create options menu
    const toggleCreateOptions = () => {
        const newShowState = !showCreateOptions;
        setShowCreateOptions(newShowState);
        setShowEditOptions(false); // Close edit options

        // When opening the menu, set active tool to create
        if (newShowState) {
            handleToolSelect('create');
        }
    };

    // Toggle edit options menu
    const toggleEditOptions = () => {
        const newShowState = !showEditOptions;
        setShowEditOptions(newShowState);
        setShowCreateOptions(false); // Close create options

        // When opening the menu, set active tool to edit
        if (newShowState) {
            handleToolSelect('edit');
        }
    };

    // Handle clicking outside to close options
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (createButtonRef.current && !createButtonRef.current.contains(event.target)) {
                setShowCreateOptions(false);
            }
            if (editButtonRef.current && !editButtonRef.current.contains(event.target)) {
                setShowEditOptions(false);
            }
        };

        if (showCreateOptions || showEditOptions) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCreateOptions, showEditOptions]);

    // Set normal cursor as default when component mounts
    useEffect(() => {
        handleToolSelect('normal');
    }, []);

    return (
        <div className="position-fixed top-50 start-0 translate-middle-y d-flex flex-column bg-dark rounded-end py-1 shadow"
            style={{ zIndex: 1030 }}>

            {tools.map(tool => (
                <div key={tool.id} className="position-relative">
                    <Button
                        ref={tool.id === 'create' ? createButtonRef : tool.id === 'edit' ? editButtonRef : null}
                        variant={
                            activeTool === tool.id ||
                                (activeTool.startsWith('create-') && tool.id === 'create') ||
                                (activeTool.startsWith('edit-') && tool.id === 'edit')
                                ? "light"
                                : "dark"
                        }
                        className="my-1 border-0"
                        onClick={() => {
                            if (tool.id === 'create') {
                                toggleCreateOptions();
                            } else if (tool.id === 'edit') {
                                toggleEditOptions();
                            } else {
                                handleToolSelect(tool.id);
                            }
                        }}
                        title={tool.title}
                        style={{ width: "50px", height: "50px" }}
                    >
                        <i className={`bi ${tool.icon}`}></i>
                    </Button>

                    {/* Create Options Overlay */}
                    {tool.id === 'create' && (
                        <Overlay
                            show={showCreateOptions}
                            target={createButtonRef.current}
                            placement="right"
                            container={document.body}
                        >
                            <Popover id="create-options-popover" className="border-0">
                                <Popover.Body className="p-1">
                                    <div className="d-flex flex-column bg-dark rounded shadow p-1">
                                        {createOptions.map(option => (
                                            <Button
                                                key={option.id}
                                                variant={activeTool === option.id ? "light" : "dark"}
                                                className="text-start d-flex align-items-center"
                                                onClick={() => handleCreateOptionSelect(option.id)}
                                                title={option.title}
                                                style={{
                                                    minWidth: "180px",
                                                    height: "40px",
                                                }}
                                            >
                                                <i className={`bi ${option.icon} me-2`}></i>
                                                <span>{option.title}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </Popover.Body>
                            </Popover>
                        </Overlay>
                    )}

                    {/* Edit Options Overlay */}
                    {tool.id === 'edit' && (
                        <Overlay
                            show={showEditOptions}
                            target={editButtonRef.current}
                            placement="right"
                            container={document.body}
                        >
                            <Popover id="create-options-popover" className="border-0">
                                <Popover.Body className="p-1">
                                    <div className="d-flex flex-column bg-dark rounded shadow p-1">
                                        {editOptions.map(option => (
                                            <Button
                                                key={option.id}
                                                variant={activeTool === option.id ? "light" : "dark"}
                                                className="text-start d-flex align-items-center"
                                                onClick={() => handleEditOptionSelect(option.id)}
                                                title={option.title}
                                                style={{
                                                    minWidth: "180px",
                                                    height: "40px",
                                                }}
                                            >
                                                <i className={`bi ${option.icon} me-2`}></i>
                                                <span>{option.title}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </Popover.Body>
                            </Popover>
                        </Overlay>
                    )}
                </div>
            ))}
        </div>
    );
};

export default LeftSidebar;
