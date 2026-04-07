// MiniMap.jsx - With mouse coordinates display
import React, { useRef, useEffect, useState } from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import './MiniMap.css';

const MiniMap = ({
    show,
    handleClose,
    currentPanoramaData,
    mapData
}) => {
    const canvasRef = useRef(null);
    const [mapImage, setMapImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, visible: false });

    // Auto-center on current position when panorama changes
    useEffect(() => {
        if (currentPanoramaData?.positionOnMinimap && mapImage) {
            // Center the view on the current panorama position
            const { x, y } = currentPanoramaData.positionOnMinimap;
            const canvas = canvasRef.current;
            if (canvas) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                setPan({
                    x: centerX - (x * zoom),
                    y: centerY - (y * zoom)
                });
            }
        }
    }, [currentPanoramaData, mapImage, zoom]);

    // Load map image using the correct path
    useEffect(() => {
        if (!show || !mapData?.minimapPath) return;

        setLoading(true);
        const img = new Image();
        img.onload = () => {
            setMapImage(img);
            setLoading(false);
        };
        img.onerror = (e) => {
            console.error("Failed to load map image:", mapData.minimapPath, e);
            setError('Failed to load map image');
            setLoading(false);
        };

        // Use the correct image path from mapData
        img.src = mapData.minimapPath;
    }, [show, mapData]);

    // Draw map and current position marker
    useEffect(() => {
        if (!canvasRef.current || !mapImage) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw map with zoom and pan
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);
        ctx.drawImage(mapImage, 0, 0);

        // Only draw the current position marker if we have position data
        if (currentPanoramaData?.positionOnMinimap) {
            const { x, y } = currentPanoramaData.positionOnMinimap;

            // Draw marker shadow
            ctx.beginPath();
            ctx.arc(x, y + 1, 12, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fill();

            // Draw marker
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fillStyle = '#FF4500';
            ctx.fill();

            // Add white border
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw a pulsing circle around current location
            const pulseSize = 18 + Math.sin(Date.now() / 200) * 3;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 69, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw name label
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // Draw background for text
            const labelText = currentPanoramaData.title || 'Current Location';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(x - (textWidth / 2) - 5, y - 28, textWidth + 10, 20);

            // Draw text
            ctx.fillStyle = '#000';
            ctx.fillText(labelText, x, y - 15);
        }

        // Draw mouse coordinates tooltip if mouse is over the canvas
        if (mousePosition.visible) {
            // Convert screen coordinates to map coordinates
            const mapX = Math.round((mousePosition.x - pan.x) / zoom);
            const mapY = Math.round((mousePosition.y - pan.y) / zoom);

            // Draw the coordinates label
            ctx.resetTransform(); // Reset transformation to draw in screen space

            const coordText = `X: ${mapX}, Y: ${mapY}`;
            ctx.font = '12px Arial';
            const textWidth = ctx.measureText(coordText).width;

            // Position the tooltip near the cursor but ensure it stays on screen
            let tooltipX = mousePosition.x + 15;
            let tooltipY = mousePosition.y - 10;

            // Adjust if it would go off the right edge
            if (tooltipX + textWidth + 10 > canvas.width) {
                tooltipX = mousePosition.x - textWidth - 15;
            }

            // Draw background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(tooltipX, tooltipY, textWidth + 10, 24);

            // Draw text
            ctx.fillStyle = '#FFF';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(coordText, tooltipX + 5, tooltipY + 12);

            // Draw crosshair at cursor position (optional)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mousePosition.x - 5, mousePosition.y);
            ctx.lineTo(mousePosition.x + 5, mousePosition.y);
            ctx.moveTo(mousePosition.x, mousePosition.y - 5);
            ctx.lineTo(mousePosition.x, mousePosition.y + 5);
            ctx.stroke();
        }

        ctx.restore();

        // Request animation frame to keep updating the pulsing effect
        if (currentPanoramaData?.positionOnMinimap) {
            requestAnimationFrame(() => {
                // This will trigger a redraw for the pulse animation
                if (canvasRef.current) {
                    const tmpCtx = canvasRef.current.getContext('2d');
                    tmpCtx.clearRect(0, 0, 1, 1); // Minimal operation to trigger rerender
                }
            });
        }
    }, [mapImage, zoom, pan, currentPanoramaData, mousePosition]);

    // Handle canvas interactions for panning
    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Start panning
        setIsDragging(true);
        setDragStart({ x: mouseX, y: mouseY });
    };

    const handleMouseMove = (e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Update mouse position for coordinates display
        setMousePosition({
            x: mouseX,
            y: mouseY,
            visible: true
        });

        // Handle dragging for panning
        if (isDragging) {
            const dx = mouseX - dragStart.x;
            const dy = mouseY - dragStart.y;

            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: mouseX, y: mouseY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseEnter = () => {
        setMousePosition(prev => ({ ...prev, visible: true }));
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setMousePosition(prev => ({ ...prev, visible: false }));
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.2, 5));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev / 1.2, 0.5));
    };

    const handleReset = () => {
        setZoom(1);

        // If we have a current panorama, center on it
        if (currentPanoramaData?.positionOnMinimap && canvasRef.current) {
            const { x, y } = currentPanoramaData.positionOnMinimap;
            const canvas = canvasRef.current;
            setPan({
                x: canvas.width / 2 - x,
                y: canvas.height / 2 - y
            });
        } else {
            setPan({ x: 0, y: 0 });
        }
    };

    // Center map on current location
    const handleCenterOnCurrent = () => {
        if (currentPanoramaData?.positionOnMinimap && canvasRef.current) {
            const { x, y } = currentPanoramaData.positionOnMinimap;
            const canvas = canvasRef.current;
            setPan({
                x: canvas.width / 2 - (x * zoom),
                y: canvas.height / 2 - (y * zoom)
            });
        }
    };

    return (
        <Offcanvas show={show} onHide={handleClose} placement="end" backdrop={false}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Map Navigation</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading map data...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : !mapImage ? (
                    <div className="alert alert-warning">
                        Map image not available. Please ensure the map has an associated image.
                    </div>
                ) : (
                    <div className="minimap-container">
                        <div className="minimap-canvas-container">
                            <canvas
                                ref={canvasRef}
                                width={400}
                                height={400}
                                className="minimap-canvas"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />

                            <div className="minimap-controls">
                                <Button variant="light" onClick={handleZoomIn} title="Zoom In">
                                    <i className="bi bi-plus-lg"></i>
                                </Button>
                                <Button variant="light" onClick={handleZoomOut} title="Zoom Out">
                                    <i className="bi bi-dash-lg"></i>
                                </Button>
                                <Button variant="light" onClick={handleReset} title="Reset View">
                                    <i className="bi bi-arrows-angle-expand"></i>
                                </Button>
                                <Button variant="primary" onClick={handleCenterOnCurrent} title="Center on Current Location">
                                    <i className="bi bi-geo-alt-fill"></i>
                                </Button>
                            </div>
                        </div>

                        <div className="minimap-info">
                            <p className="mb-1">
                                <strong>Current location:</strong> {currentPanoramaData?.title || 'Unknown'}
                            </p>
                            {currentPanoramaData?.positionOnMinimap ? (
                                <p className="text-muted small mb-0">
                                    Position: X: {Math.round(currentPanoramaData.positionOnMinimap.x)},
                                    Y: {Math.round(currentPanoramaData.positionOnMinimap.y)}
                                </p>
                            ) : (
                                <p className="text-muted small mb-0">No position data available</p>
                            )}
                        </div>
                    </div>
                )}
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default MiniMap;