import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Button, Alert, Spinner } from 'react-bootstrap';
import PanoramaViewer from '../../components/PanoramaViewer/PanoramaViewer';
import { baseURL } from '../../utils/baseUrl';
import { useMapContext } from '../../components/Header/Header';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import LeftSidebar from '../../components/LeftSideBar/LeftSideBar';
import InlineMiniMap from '../../components/minimap/InlineMiniMap';
import QuizCreator from '../../components/quiz/QuizCreator/QuizCreator';
import AddPanoramaModal from '../../components/panorama/AddPanoramaModal';
import AddPanoramaForm from '../../components/AddPanoramaForm/AddPanoramaForm';


const MapViewPage = ({ isEditMode: initialEditMode = false }) => {
    const { mapId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { updateMapData } = useMapContext();

    // determine if we're in edit mode based on URL path
    const isEditMode = location.pathname.includes('/edit') || initialEditMode;

    // main state object
    const [state, setState] = useState({
        mapData: null,
        currentPanoramaId: null,
        currentPanoramaData: null,
        loading: true,
        error: null,
        currentViewSettings: null,
        isInitialLoad: true,
        currentTool: 'normal',
        showQuizCreator: false,
        showAddPanorama: false,
    });
    // 🔹 Handler to open the Add Panorama modal
    const handleOpenAddPanorama = () => {
      setState(prev => ({ ...prev, showAddPanorama: true }));
    };

    // 🔹 Handler to close the Add Panorama modal
    const handleCloseAddPanorama = () => {
      setState(prev => ({ ...prev, showAddPanorama: false }));
    };

    // 🔹 Handler after successfully adding a panorama
    const handlePanoramaAdded = (newPanorama) => {
      console.log("✅ Panorama created:", newPanorama);
      setState(prev => ({
        ...prev,
        showAddPanorama: false,
        currentPanoramaData: newPanorama,
      }));
    };

    const {
        mapData,
        currentPanoramaId,
        currentPanoramaData,
        loading,
        error,
        currentViewSettings,
        isInitialLoad,
        currentTool,
        showQuizCreator
    } = state;

    // fetch map data
    const fetchMapData = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response = await axios.get(`${baseURL}/maps/${mapId}`, {
                withCredentials: true
            });

            const fetchedMapData = response.data.map;

            setState(prev => {
                // only set panorama if we don't already have one (initial load)
                const shouldSetInitialPanorama = !prev.currentPanoramaId && fetchedMapData.startingPanoramaId?._id;

                return {
                    ...prev,
                    mapData: fetchedMapData,
                    ...(shouldSetInitialPanorama && {
                        currentPanoramaId: fetchedMapData.startingPanoramaId._id,
                        isInitialLoad: true
                    }),
                    loading: false
                };
            });

            // update context with map data for Header
            updateMapData(fetchedMapData);
        } catch (error) {
            console.error('Error fetching map data:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load map data. Please try again.',
                loading: false
            }));
        }
    }, [mapId]);

    // fetch current panorama data
    const fetchPanoramaData = useCallback(async (panoramaId) => {
        if (!panoramaId) {
            setState(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            setState(prev => ({ ...prev, loading: true }));

            const response = await axios.get(`${baseURL}/panoramas/${panoramaId}`, {
                withCredentials: true
            });

            setState(prev => ({
                ...prev,
                currentPanoramaData: response.data.panorama,
                loading: false
            }));
        } catch (error) {
            console.error('Error fetching panorama data:', error);
            setState(prev => ({
                ...prev,
                error: 'Failed to load panorama data. Please try again.',
                loading: false
            }));
        }
    }, []);

    // initial data loading
    useEffect(() => {
        fetchMapData();
    }, [fetchMapData]);

    // load panorama when currentPanoramaId changes
    useEffect(() => {
        if (currentPanoramaId) {
            fetchPanoramaData(currentPanoramaId);
        } else if (mapData) {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [currentPanoramaId, fetchPanoramaData, mapData]);

    // reset tool when switching modes
    useEffect(() => {
        setState(prev => ({
            ...prev,
            currentTool: 'normal'
        }));
    }, [isEditMode]);

    // handle navigation from Panorama hotspots
    const handlePanoramaNavigation = useCallback((newPanoramaId, targetView) => {
        if (newPanoramaId === currentPanoramaId) return;

        console.log("Navigating to panorama:", newPanoramaId, "with view:", targetView);

        setState(prev => ({
            ...prev,
            currentPanoramaId: newPanoramaId,
            currentViewSettings: targetView,
            isInitialLoad: false
        }));
    }, [currentPanoramaId]);

    // handle cursor tool change
    const handleCursorChange = useCallback((tool) => {
        console.log("Cursor tool changed to:", tool);

        setState(prev => ({
            ...prev,
            currentTool: tool,
            showQuizCreator: tool === 'create-quiz',
            showAddPanorama: tool === 'add-panorama'
        }));
    }, []);
    // 🆕 Open Add Panorama modal when selected from sidebar
    useEffect(() => {
      if (state.currentTool === 'add-panorama') {
        setState(prev => ({ ...prev, showAddPanorama: true }));
      }
    }, [state.currentTool]);



    const handleQuizCreatorClose = useCallback(() => {
        setState(prev => ({
            ...prev,
            showQuizCreator: false,
            currentTool: 'normal'
        }));
    }, []);

    // 🆕 Handle Add Panorama modal toggle
    const handleShowAddPanorama = useCallback(() => {
      setState(prev => ({
        ...prev,
        showAddPanorama: !prev.showAddPanorama,
      }));
    }, []);

    // 🆕 Close Add Panorama modal
    const handleAddPanoramaClose = useCallback(() => {
      setState(prev => ({
        ...prev,
        showAddPanorama: false,
        currentTool: 'normal',
      }));
    }, []);


    // Handle errors
    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchMapData}>Retry</Button>
                </Alert>
            </Container>
        );
    }

    // Show loading state
    if (loading && !mapData) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                <div className="text-center">
                    <Spinner animation="border" role="status" className="mb-3">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <h4>Loading...</h4>
                </div>
            </Container>
        );
    }

    // Map not found
    if (!mapData) {
        return (
            <Container className="py-5">
                <div className="text-center">
                    <h2>Map not found</h2>
                    <p className="text-muted">The requested map could not be found.</p>
                    <Button variant="primary" onClick={() => navigate('/maps')}>Back to Maps</Button>
                </div>
            </Container>
        );
    }

    // Determine which view settings to use
    const viewSettings = isInitialLoad ? mapData.initialView : currentViewSettings;

    return (
        <Container fluid className="map-view-container p-0">
            {/* Main content with overlays */}
            <div className="position-relative">
                {/* Full-width panorama viewer */}
                <div className="panorama-container">
                    <PanoramaViewer
                        mapId={mapId}
                        minimapPath={mapData.minimapPath}
                        panoramaId={currentPanoramaId}
                        initialPanoramaData={currentPanoramaData}
                        initialView={viewSettings}
                        onNavigate={handlePanoramaNavigation}
                        isEditMode={isEditMode}
                        currentTool={currentTool}
                    />
                </div>

                {/* Overlaid sidebars */}
                {isEditMode && (
                    <div
                        className="left-sidebar-overlay"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            zIndex: 3
                        }}
                    >
                        <LeftSidebar onCursorChange={handleCursorChange} />
                    </div>
                )}

                <div
                    className="right-sidebar-overlay"
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        height: '100%',
                        zIndex: 3
                    }}
                >
                    <RightSidebar
                        isEditMode={isEditMode}
                        currentPanoramaData={currentPanoramaData}
                        mapData={mapData}
                        mapId={mapId}
                    />
                </div>

                <QuizCreator
                    show={showQuizCreator && !!mapId}
                    onHide={handleQuizCreatorClose}
                    mapId={mapId}
                />
		{state.showAddPanorama && (
		  <AddPanoramaModal
		    mapId={mapId}    
                    onClose={handleAddPanoramaClose}
                  />
                 )}
            </div>

            <div className="mt-3 mb-5">
                <InlineMiniMap
                    currentPanoramaData={currentPanoramaData}
                    mapData={mapData}
                />
            </div>
        </Container>
    );
};

export default MapViewPage;
