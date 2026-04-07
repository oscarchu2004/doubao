import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { baseURL } from '../../utils/baseUrl';
import 'pannellum/build/pannellum.css';
import TaskDetail from '../TaskDetail/TaskDetail';
import MiniQuiz from '../quiz/MiniQuiz/MiniQuiz';
import { Alert, Modal } from 'react-bootstrap';
import { Container, Spinner } from 'react-bootstrap';

import './HotspotStyles.css';

// Import our components
import NavigationHotspotCreator from '../NavigationHotspotCreator/NavigationHotspotCreator';
import NavigationHotspotEditor from '../NavigationHotspotEditor/NavigationHotspotEditor';
import TaskCreator from '../task/TaskCreator/TaskCreator';
import PanoramaEmptyState from '../PanoramaEmptyState/PanoramaEmptyState';

const PanoramaViewer = ({ mapId, minimapPath, panoramaId, initialPanoramaData, initialView, isEditMode = false, currentTool = 'normal', onNavigate, onPanoramaAdded }) => {
    const viewerContainerRef = useRef(null);
    const viewerInstance = useRef(null);
    const [currentView, setCurrentView] = useState({
        yaw: 0,
        pitch: 0,
        hfov: 100
    });
    const [state, setState] = useState({
        panoramaData: initialPanoramaData,
        hotspots: [],
        scriptLoaded: false,
        showTaskModal: false,
        selectedTask: null,
        loading: false,
        error: null
    });
    const [showChallengeQuiz, setShowChallengeQuiz] = useState(false);
    const [challengeQuestions, setChallengeQuestions] = useState([]);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [pendingTaskHotspot, setPendingTaskHotspot] = useState(null);
    const [quizId, setQuizId] = useState(null);

    // Navigation Hotspot Creator state
    const [showNavigationCreator, setShowNavigationCreator] = useState(false);
    const [pendingNavigationPosition, setPendingNavigationPosition] = useState(null);

    // Navigation Hotspot Editor state
    const [showNavigationEditor, setShowNavigationEditor] = useState(false);
    const [selectedNavigationHotspot, setSelectedNavigationHotspot] = useState(null);

    // Task Creator state
    const [showTaskCreator, setShowTaskCreator] = useState(false);
    const [pendingTaskPosition, setPendingTaskPosition] = useState(null);

    const { panoramaData, hotspots, scriptLoaded, showTaskModal, selectedTask, loading, error } = state;

    // Update panorama data when initialPanoramaData changes
    useEffect(() => {
        setState(prev => ({ ...prev, panoramaData: initialPanoramaData }));
    }, [initialPanoramaData]);

    // Load Pannellum script
    useEffect(() => {
        if (window.pannellum) {
            setState(prev => ({ ...prev, scriptLoaded: true }));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
        script.async = true;

        script.onload = () => setState(prev => ({ ...prev, scriptLoaded: true }));

        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    // Fetch hotspots data
    const fetchHotspots = useCallback(async (panId) => {
        if (!panId) return;

        try {
            setState(prev => ({ ...prev, loading: true }));

            const response = await axios.get(
                `${baseURL}/hotspots/panorama/${panId}`,
                { withCredentials: true }
            );

            setState(prev => ({
                ...prev,
                hotspots: response.data.hotspots,
                loading: false
            }));
        } catch (error) {
            console.error('Error fetching hotspots:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load hotspots',
                loading: false
            }));
        }
    }, []);

    // Track mouse state for drag detection - using useRef to avoid re-renders
    const mouseStateRef = useRef({
        isDown: false,
        startX: 0,
        startY: 0,
        hasDragged: false
    });

    // Stable reference to current tool and edit mode
    const currentToolRef = useRef(currentTool);
    const isEditModeRef = useRef(isEditMode);

    useEffect(() => {
        currentToolRef.current = currentTool;
        isEditModeRef.current = isEditMode;
        console.log('Tool updated in PanoramaViewer:', currentTool);
    }, [currentTool, isEditMode]);

    // Verify if quiz exists before attempting to fetch questions
    const verifyQuizExists = useCallback(async (quizId) => {
        try {
            const extractedQuizId = typeof quizId === 'object' ? quizId._id : quizId;

            if (!extractedQuizId) {
                console.warn("No quiz ID provided for verification");
                return false;
            }

            // Simple quiz existence check - just try to get quiz info
            const response = await axios.get(
                `${baseURL}/quiz/${extractedQuizId}`,
                { withCredentials: true }
            );

            return response.data && response.data.quiz;
        } catch (error) {
            console.error('Quiz verification failed:', error);
            return false;
        }
    }, []);

    // Fetch challenge questions only when needed
    const fetchChallengeQuestions = useCallback(async (quizId) => {
        try {
            setState(prev => ({ ...prev, loading: true }));

            const response = await axios.get(
                `${baseURL}/questions/quiz/${quizId}`,
                { withCredentials: true }
            );

            if (response.data.questions && response.data.questions.length > 0) {
                setChallengeQuestions(response.data.questions);
                setShowChallengeQuiz(true);
                console.log(`Loaded ${response.data.questions.length} challenge questions`);
            } else {
                console.warn("No challenge questions found for this quiz");
                setState(prev => ({
                    ...prev,
                    error: 'No questions found for this challenge',
                    loading: false
                }));
                return;
            }

            setState(prev => ({ ...prev, loading: false }));
        } catch (error) {
            console.error('Error fetching challenge questions:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load challenge questions',
                loading: false
            }));
        }
    }, []);

    // Load hotspots when panoramaId changes
    useEffect(() => {
        fetchHotspots(panoramaId);
    }, [panoramaId, fetchHotspots]);

    // Find task by hotspot
    const findTaskByHotspot = useCallback(async (hotspotId) => {
        try {
            setState(prev => ({ ...prev, loading: true }));

            const response = await axios.get(
                `${baseURL}/tasks/hotspot/${hotspotId}`,
                { withCredentials: true }
            );

            if (response.data.task) {
                if (response.data.isAvailable) {
                    setState(prev => ({
                        ...prev,
                        selectedTask: response.data.task,
                        showTaskModal: true,
                        loading: false
                    }));
                } else {
                    alert(response.data.message || "Complete previous tasks first");
                    setState(prev => ({ ...prev, loading: false }));
                }
            }
        } catch (error) {
            console.error('Error finding task for hotspot:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to find task',
                loading: false
            }));
        }
    }, []);

    const deleteHotspot = useCallback(async (hotspotId) => {
        try {
            setState(prev => ({ ...prev, loading: true }));

            const response = await axios.delete(
                `${baseURL}/hotspots/delete/${hotspotId}`,
                { withCredentials: true }
            );

            if (response.status === 200) {
                console.log('Hotspot deleted successfully:', response.data);

                // Refresh hotspots to remove the deleted one
                await fetchHotspots(panoramaId);

                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: null
                }));
            }
        } catch (error) {
            console.error('Error deleting hotspot:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to delete hotspot',
                loading: false
            }));
        }
    }, [panoramaId, fetchHotspots]);

    // Handle hotspot clicks with edit mode support
    const handleHotspotClick = useCallback((hotspot) => {
        if (!hotspot) return;

        // Handle delete mode
        if (currentToolRef.current === 'delete' && isEditModeRef.current) {
            if (window.confirm(`Are you sure you want to delete "${hotspot.title || 'this hotspot'}"?`)) {
                deleteHotspot(hotspot._id);
            }
            return;
        }

        // Handle edit-navigation mode
        if (currentToolRef.current === 'edit-navigation' && isEditModeRef.current && hotspot.type === 'navigation') {
            console.log('Opening navigation hotspot editor for:', hotspot);
            setSelectedNavigationHotspot(hotspot);
            setShowNavigationEditor(true);
            return;
        }

        // Your existing hotspot click logic below...
        switch (hotspot.type) {
            case 'navigation':
                // Check if navigation hotspot has target data
                if (!hotspot.targetPanoramaId || !hotspot.targetInitialView) {
                    console.warn("Navigation hotspot missing target data");
                    return;
                }

                // Check if navigation hotspot requires a challenge
                if (hotspot.requiresChallenge && hotspot.challengeQuizId) {
                    // First verify the quiz exists before proceeding
                    verifyQuizExists(hotspot.challengeQuizId)
                        .then(quizExists => {
                            if (quizExists) {
                                // Store the navigation info for later use after challenge completion
                                setPendingNavigation({
                                    targetId: hotspot.targetPanoramaId._id,
                                    targetView: hotspot.targetInitialView
                                });

                                // Handle both populated object and string ID for challengeQuizId
                                const quizId = typeof hotspot.challengeQuizId === 'object'
                                    ? hotspot.challengeQuizId._id
                                    : hotspot.challengeQuizId;

                                setQuizId(quizId);
                                console.log('Challenge required - Quiz ID:', quizId);

                                // Now fetch and show challenge questions
                                fetchChallengeQuestions(quizId);
                            } else {
                                console.warn("Challenge quiz not found, proceeding without challenge");
                                // Proceed without challenge if quiz doesn't exist
                                if (onNavigate && hotspot.targetPanoramaId?._id) {
                                    onNavigate(hotspot.targetPanoramaId._id, hotspot.targetInitialView);
                                }
                            }
                        })
                        .catch(error => {
                            console.error("Error verifying quiz:", error);
                            // Fallback to direct navigation if quiz check fails
                            if (onNavigate && hotspot.targetPanoramaId?._id) {
                                onNavigate(hotspot.targetPanoramaId._id, hotspot.targetInitialView);
                            }
                        });
                } else {
                    // No challenge required, navigate directly
                    if (onNavigate && hotspot.targetPanoramaId?._id) {
                        console.log("Navigating directly without challenge");
                        onNavigate(hotspot.targetPanoramaId._id, hotspot.targetInitialView);
                    } else {
                        console.warn("Navigation hotspot missing required data");
                    }
                }
                break;

            case 'info':
                console.log(`Info hotspot clicked: ${hotspot.title}`);
                break;

            case 'task':
                // Check if task hotspot requires a challenge
                if (hotspot.requiresChallenge && hotspot.challengeQuizId) {
                    // First verify the quiz exists before proceeding
                    verifyQuizExists(hotspot.challengeQuizId)
                        .then(quizExists => {
                            if (quizExists) {
                                // Store the task hotspot info for later use after challenge completion
                                setPendingTaskHotspot(hotspot._id);

                                // Handle both populated object and string ID for challengeQuizId
                                const quizId = typeof hotspot.challengeQuizId === 'object'
                                    ? hotspot.challengeQuizId._id
                                    : hotspot.challengeQuizId;

                                setQuizId(quizId);
                                console.log('Task challenge required - Quiz ID:', quizId);

                                // Now fetch and show challenge questions
                                fetchChallengeQuestions(quizId);
                            } else {
                                console.warn("Challenge quiz not found, proceeding without challenge");
                                // Proceed without challenge if quiz doesn't exist
                                findTaskByHotspot(hotspot._id);
                            }
                        })
                        .catch(error => {
                            console.error("Error verifying task quiz:", error);
                            // Fallback to direct task access if quiz check fails
                            findTaskByHotspot(hotspot._id);
                        });
                } else {
                    // No challenge required, find task directly
                    console.log("Finding task directly without challenge");
                    findTaskByHotspot(hotspot._id);
                }
                break;

            default:
                console.log(`Unknown hotspot type: ${hotspot.type}`);
        }
    }, [onNavigate, verifyQuizExists, fetchChallengeQuestions, findTaskByHotspot, deleteHotspot]);

    // Handle task completion
    const handleTaskComplete = useCallback((taskId) => {
        fetchHotspots(panoramaId);
    }, [panoramaId, fetchHotspots]);

    // Handle navigation hotspot creation completion
    const handleNavigationHotspotCreated = useCallback(async () => {
        console.log('Navigation hotspot created successfully');

        // Refresh hotspots to show the new one
        await fetchHotspots(panoramaId);

        // Close the creator modal
        setShowNavigationCreator(false);
        setPendingNavigationPosition(null);
    }, [panoramaId, fetchHotspots]);

    // Handle navigation hotspot update completion
    const handleNavigationHotspotUpdated = useCallback(async (updatedHotspot) => {
        console.log('Navigation hotspot updated successfully:', updatedHotspot);

        // Refresh hotspots to show the updated one
        await fetchHotspots(panoramaId);

        // Close the editor modal
        setShowNavigationEditor(false);
        setSelectedNavigationHotspot(null);
    }, [panoramaId, fetchHotspots]);

    // Handle task creation completion
    const handleTaskCreated = useCallback(async (newTask) => {
        console.log('Task created successfully:', newTask);

        // Refresh hotspots to show updated task hotspot
        await fetchHotspots(panoramaId);

        // Close the task creator modal
        setShowTaskCreator(false);
        setPendingTaskPosition(null);
    }, [panoramaId, fetchHotspots]);

    // Handle creator modal close
    const handleNavigationCreatorClose = useCallback(() => {
        setShowNavigationCreator(false);
        setPendingNavigationPosition(null);
    }, []);

    // Handle editor modal close
    const handleNavigationEditorClose = useCallback(() => {
        setShowNavigationEditor(false);
        setSelectedNavigationHotspot(null);
    }, []);

    // Handle task creator modal close
    const handleTaskCreatorClose = useCallback(() => {
        setShowTaskCreator(false);
        setPendingTaskPosition(null);
    }, []);

    // Handle panorama added from empty state
    const handleEmptyStatePanoramaAdded = useCallback((newPanorama) => {
        console.log('Panorama added from empty state:', newPanorama);

	// NEW  Ensure the panorama image path is fully qualified
	const backendBase = "https://shome3-backend.hudini.online";
	if (newPanorama?.imagePath && !newPanorama.imagePath.startsWith('http')) {
		newPanorama.imagePath = `${backendBase}${newPanorama.imagePath}`;
	}


        // Call the parent's onPanoramaAdded callback if provided
        if (onPanoramaAdded && typeof onPanoramaAdded === 'function') {
            onPanoramaAdded(newPanorama);
        }
        // This would typically trigger navigation to the new panorama
        if (onNavigate && newPanorama._id) {
            onNavigate(newPanorama._id);
        }
    }, [onNavigate, onPanoramaAdded]);

    // Handle challenge completion for both navigation and task hotspots
    const handleChallengeCompletion = useCallback((passed = true) => {
        console.log("Challenge completion called with passed:", passed);

        if (passed) {
            // Challenge passed - proceed with the pending action
            if (pendingNavigation) {
                console.log("Challenge passed! Navigating to:", pendingNavigation);
                if (onNavigate) {
                    onNavigate(pendingNavigation.targetId, pendingNavigation.targetView);
                }
                setPendingNavigation(null);
            } else if (pendingTaskHotspot) {
                console.log("Challenge passed! Finding task for hotspot:", pendingTaskHotspot);
                findTaskByHotspot(pendingTaskHotspot);
                setPendingTaskHotspot(null);
            }
        } else {
            // Challenge failed - clear pending actions
            console.log("Challenge failed! Access denied.");
            setPendingNavigation(null);
            setPendingTaskHotspot(null);

            // Show user feedback
            setState(prev => ({
                ...prev,
                error: 'Challenge failed. Please try again to access this content.'
            }));
        }

        // Clear challenge-related states
        setQuizId(null);
        setChallengeQuestions([]);
        setShowChallengeQuiz(false);
    }, [pendingNavigation, pendingTaskHotspot, onNavigate, findTaskByHotspot]);

    // Initialize or update panorama viewer
    useEffect(() => {
        if (!scriptLoaded || !viewerContainerRef.current || !panoramaData?.imagePath) return;

        // Clean up old instance
        if (viewerInstance.current) {
            viewerInstance.current.destroy();
            viewerInstance.current = null;
        }

        // Create hotspots configurations for Pannellum
        const pannellumHotspots = hotspots
            .filter(h => h.isVisible)
            .map(hotspot => {
                // Base hotspot configuration
                const config = {
                    id: `hotspot-${hotspot._id}`,
                    pitch: hotspot.position.pitch,
                    yaw: hotspot.position.yaw,
                    text: hotspot.title || hotspot.label,
                    clickHandlerFunc: () => handleHotspotClick(hotspot)
                };

                // Specific settings based on hotspot type
                if (hotspot.type === 'navigation') {
                    // Custom navigation hotspot with direction pointer
                    config.cssClass = 'navigation-hotspot';
                } else if (hotspot.type === 'task') {
                    // Custom task hotspot with tickbox icon
                    config.cssClass = 'task-hotspot';
                } else if (hotspot.type === 'info') {
                    // Custom info hotspot with magnifying glass
                    config.cssClass = 'info-hotspot';
                } else {
                    // Fallback to default Pannellum styling
                    config.type = 'info';
                }

                return config;
            });

        console.log("Initializing viewer with view:", initialView);

        // Initialize Pannellum viewer with initialView if available
        viewerInstance.current = window.pannellum.viewer(viewerContainerRef.current, {
            type: 'equirectangular',
            panorama: panoramaData.imagePath,
            autoLoad: true,
            compass: true,
            showControls: true,
            showFullscreenCtrl: true,
            showZoomCtrl: true,
            hfov: initialView?.hfov || 100,
            yaw: initialView?.yaw || 0,
            pitch: initialView?.pitch || 0,
            // title: panoramaData.title || '',
            hotSpots: pannellumHotspots,
            hotSpotDebug: false
        });

        setCurrentView({
            yaw: initialView?.yaw || 0,
            pitch: initialView?.pitch || 0,
            hfov: initialView?.hfov || 100
        });


        // --- Compass click to reset (safe, no early return) ---
        const HOME = { yaw: 0, pitch: 0, hfov: 120 };

        const bindCompassReset = () => {
        const container = viewerContainerRef.current;
        const el = container?.querySelector(
            '.pnlm-compass, .pnlm-compassCtrl, .pnlm-orientation'
        );
        if (!el) return;

        el.style.cursor = 'pointer';
        el.title = 'Reset view';

        // Remove previous handler (if any) to avoid duplicate bindings
        if (el._resetHandler) el.removeEventListener('click', el._resetHandler);

        el._resetHandler = (e) => {
            e.preventDefault();
            const v = viewerInstance.current;
            if (!v) return;
            if (typeof v.lookAt === 'function') {
            v.lookAt(HOME.pitch, HOME.yaw, HOME.hfov, true); // animate to home view
            } else {
            v.setPitch(HOME.pitch);
            v.setYaw(HOME.yaw);
            v.setHfov(HOME.hfov);
            }
        };
        el.addEventListener('click', el._resetHandler);
        };

        // Bind after Pannellum renders its UI (including the compass)
        viewerInstance.current.on('load', bindCompassReset);







        // Add event listeners to track view changes
        viewerInstance.current.on('animatefinished', function () {
            const view = viewerInstance.current.getConfig();
            setCurrentView({
                yaw: view.yaw,
                pitch: view.pitch,
                hfov: view.hfov
            });
        });

        // Track zoom changes
        viewerInstance.current.on('zoomchange', function () {
            const view = viewerInstance.current.getConfig();
            setCurrentView(prev => ({
                ...prev,
                hfov: view.hfov
            }));
        });


        // Add Pannellum-specific event listeners for drag detection and hotspot creation
        viewerInstance.current.on('mousedown', function (event) {
            mouseStateRef.current = {
                isDown: true,
                startX: event.clientX,
                startY: event.clientY,
                hasDragged: false,
                downTime: Date.now()
            };
            console.log('Mouse down at:', event.clientX, event.clientY);
        });

        viewerInstance.current.on('mousemove', function (event) {
            if (!mouseStateRef.current.isDown) return;

            const deltaX = Math.abs(event.clientX - mouseStateRef.current.startX);
            const deltaY = Math.abs(event.clientY - mouseStateRef.current.startY);

            // Threshold for drag detection (10px)
            if (deltaX > 3 || deltaY > 3) {
                if (!mouseStateRef.current.hasDragged) {
                    console.log('Drag detected! Delta:', deltaX, deltaY);
                }
                mouseStateRef.current.hasDragged = true;
            }
        });

        viewerInstance.current.on('mouseup', function (event) {
            const wasDragged = mouseStateRef.current.hasDragged;
            const isClick = !wasDragged && Date.now() - mouseStateRef.current.downTime < 150;

            console.log('Mouse up - hasDragged:', wasDragged);

            // Update view after any mouse interaction
            const view = viewerInstance.current.getConfig();
            setCurrentView({
                yaw: view.yaw,
                pitch: view.pitch,
                hfov: view.hfov
            });


            // Reset drag state
            mouseStateRef.current.isDown = false;
            mouseStateRef.current.hasDragged = false;

            // Only handle clicks in create modes and edit mode
            if (
                !isEditModeRef.current ||
                !isClick ||
                (currentToolRef.current !== 'create-navigation' && currentToolRef.current !== 'create-task')
            ) {
                return;
            }

            // Use Pannellum's built-in coordinate conversion
            const coords = viewerInstance.current.mouseEventToCoords(event);
            const pitch = coords[0];
            const yaw = coords[1];

            console.log('Position selected - Pitch:', pitch.toFixed(2), 'Yaw:', yaw.toFixed(2));

            // Store position and open creator based on current tool
            if (currentToolRef.current === 'create-navigation') {
                setPendingNavigationPosition({ yaw, pitch });
                setShowNavigationCreator(true);
            } else if (currentToolRef.current === 'create-task') {
                setPendingTaskPosition({ yaw, pitch });
                setShowTaskCreator(true);
            }
        });

    }, [panoramaData, hotspots, initialView, scriptLoaded, handleHotspotClick]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setState(prev => ({ ...prev, showTaskModal: false }));
    }, []);

    // Clear error after a delay
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setState(prev => ({ ...prev, error: null }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Use PanoramaEmptyState when no panorama data is available
    if (!panoramaData) {
        return (
            <Container fluid className="panorama-container p-0">
                <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                    <PanoramaEmptyState
                        mapId={mapId}
                        isEditMode={isEditMode}
                        minimapPath = {minimapPath}
                        onPanoramaAdded={handleEmptyStatePanoramaAdded}
                        height="400px"
                        title="No panorama selected"
                        description="Select a panorama to view"
                        noEditMessage="Contact the map creator to add panoramas"
                    />
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="panorama-container p-0">
            <div className="panorama-viewer">
                <div
                    ref={viewerContainerRef}
                    className="viewer-container"
                    style={{
                        width: "100%",
                        height: "80vh",
                        backgroundColor: "#000000"
                    }}
                />

                {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <Spinner animation="border" role="status" variant="light">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                )}

                <div className="position-absolute top-0 end-0 m-2" style={{ zIndex: 1000 }}>
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: 'white',
                        padding: '4px 8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'nowrap'
                    }}>
                        ID: {panoramaId || 'N/A'} | Yaw: {currentView.yaw.toFixed(1)}° | Pitch: {currentView.pitch.toFixed(1)}° | FOV: {currentView.hfov.toFixed(0)}°
                    </div>
                </div>

                {/* Show error alert */}
                {error && (
                    <div className="position-absolute top-0 start-50 translate-middle-x mt-3">
                        <Alert variant="danger" dismissible onClose={() => setState(prev => ({ ...prev, error: null }))}>
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </Alert>
                    </div>
                )}

                {/* Show instruction when in create or edit modes */}
                {isEditMode && (currentTool === 'create-navigation' || currentTool === 'create-task' || currentTool === 'edit-navigation') && (
                    <div className="position-absolute top-0 start-50 translate-middle-x mt-3">
                        <Alert variant="info" className="mb-0">
                            <i className="bi bi-info-circle me-2"></i>
                            {currentTool === 'create-navigation' && 'Click on the panorama to place a navigation hotspot'}
                            {currentTool === 'create-task' && 'Click on the panorama to place a task hotspot'}
                            {currentTool === 'edit-navigation' && 'Click on a navigation hotspot to edit it'}
                        </Alert>
                    </div>
                )}
            </div>

            {/* Navigation Hotspot Creator Modal */}
            <NavigationHotspotCreator
                show={showNavigationCreator}
                onHide={handleNavigationCreatorClose}
                mapId={mapId}
                panoramaId={panoramaId}
                position={pendingNavigationPosition}
                onHotspotCreated={handleNavigationHotspotCreated}
                minimapPath={minimapPath}
            />

            {/* Navigation Hotspot Editor Modal */}
            <NavigationHotspotEditor
                show={showNavigationEditor}
                onHide={handleNavigationEditorClose}
                hotspot={selectedNavigationHotspot}
                onHotspotUpdated={handleNavigationHotspotUpdated}
            />

            {/* Task Detail Modal */}
            <TaskDetail
                show={showTaskModal}
                onHide={handleModalClose}
                task={selectedTask}
                onTaskComplete={handleTaskComplete}
            />

            {/* Challenge Quiz Modal */}
            <MiniQuiz
                show={showChallengeQuiz}
                questions={challengeQuestions}
                onClose={() => setShowChallengeQuiz(false)}
                onComplete={handleChallengeCompletion}
                selectedQuiz={quizId}
                currentMapId={mapId}
            />

            {/* Task Creator Modal */}
            <TaskCreator
                show={showTaskCreator}
                onHide={handleTaskCreatorClose}
                mapId={mapId}
                panoramaId={panoramaId}
                position={pendingTaskPosition}
                title="Create Task for Hotspot"
                onTaskCreated={handleTaskCreated}
            />
        </Container>
    );
};

export default PanoramaViewer;
