// RightSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Button, Offcanvas } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import MissionPanel from '../MissionPanel/MissionPanel';
import QuizPanel from '../quiz/QuizPanel/QuizPanel';
import MiniMap from '../minimap/MiniMap';

const RightSidebar = ({
    isEditMode,
    currentPanoramaData,
    mapData,
    mapId
    // onSelectLocation
}) => {
    const [show, setShow] = useState(false);
    const [activeTab, setActiveTab] = useState('');

    const handleClose = () => setShow(false);

    const handleShow = (tab) => {
        setActiveTab(tab);
        setShow(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'mission':
                return <MissionPanel 
                show={show} 
                handleClose={handleClose} 
                mapId={mapId} 
                isEditMode = {isEditMode}
                />;

            case 'quiz':
                return <QuizPanel 
                show={show} 
                handleClose={handleClose}
                isEditMode = {isEditMode} 
                />;

            // case 'map':
            //     return (
            //         <MiniMap
            //             show={show}
            //             handleClose={handleClose}
            //             currentPanoramaData={currentPanoramaData}
            //             mapData={mapData}
            //         />
            //     );

            // case 'help':
                return (
                    <>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>Help</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <h5>Navigation Controls</h5>
                            <p>Click and drag to look around</p>
                            <p>Use scroll wheel to zoom in/out</p>

                            <h5>Missions</h5>
                            <p>Complete tasks by finding and clicking on highlighted objects</p>

                            <h5>Hotspots</h5>
                            <p>Click on hotspots to interact with the environment</p>

                            {isEditMode && (
                                <>
                                    <h5>Edit Mode</h5>
                                    <p>Create and edit quizzes by clicking the Quiz Editor button</p>
                                    <p>Add questions and set correct answers</p>
                                </>
                            )}
                        </Offcanvas.Body>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div className="position-fixed top-50 end-0 translate-middle-y d-flex flex-column bg-dark rounded-start py-2 shadow"
                style={{ zIndex: 1030 }}>
                <Button
                    variant={activeTab === 'mission' && show ? "light" : "dark"}
                    className="my-1 border-0"
                    onClick={() => handleShow('mission')}
                    title="Missions"
                    style={{ width: "50px", height: "50px" }}
                >
                    <i className="bi bi-list-task"></i>
                </Button>

                {/* <Button
                    variant={activeTab === 'map' && show ? "light" : "dark"}
                    className="my-1 border-0"
                    onClick={() => handleShow('map')}
                    title="Map"
                    style={{ width: "50px", height: "50px" }}
                >
                    <i className="bi bi-map"></i>
                </Button> */}

                <Button
                    variant={activeTab === 'quiz' && show ? "light" : "dark"}
                    className="my-1 border-0"
                    onClick={() => handleShow('quiz')}
                    title={isEditMode ? "Quiz Editor" : "Quiz"}
                    style={{ width: "50px", height: "50px" }}
                >
                    <i className="bi bi-question-circle"></i>
                </Button>

                {/* <Button
                    variant={activeTab === 'help' && show ? "light" : "dark"}
                    className="my-1 border-0"
                    onClick={() => handleShow('help')}
                    title="Help"
                    style={{ width: "50px", height: "50px" }}
                >
                    <i className="bi bi-info-circle"></i>
                </Button> */}
            </div>

            {/* The content is rendered by the specific component */}
            {renderContent()}
        </>
    );
};

export default RightSidebar;