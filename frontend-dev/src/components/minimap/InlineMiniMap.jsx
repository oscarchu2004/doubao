// src/components/minimap/InlineMiniMap.jsx
import React, { useRef, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import './MiniMap.css'; // reuses the same styling for canvas + controls
import { getUploadedFileUrl } from '../../utils/helperFunction';


/**
 * InlineMiniMap
 *
 * Renders exactly the same canvas + drawing logic that MiniMap does,
 * but outside of any Offcanvas. Always visible.
 *
 * Props:
 *   - currentPanoramaData: { positionOnMinimap: { x, y }, title }
 *     WHERE x, y are NORMALIZED coordinates (0.0 to 1.0)
 *   - mapData: { minimapPath }
 */
const InlineMiniMap = ({ currentPanoramaData, mapData }) => {
  const canvasRef = useRef(null);
  const [mapImage, setMapImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0, visible: false });

  // Helper function to convert normalized coordinates to actual pixel coordinates
  const normalizedToPixel = (normalizedX, normalizedY) => {
    if (!mapImage) return { x: 0, y: 0 };
    return {
      x: normalizedX * mapImage.width,
      y: normalizedY * mapImage.height
    };
  };

  // Helper function to convert pixel coordinates to normalized coordinates
  const pixelToNormalized = (pixelX, pixelY) => {
    if (!mapImage) return { x: 0, y: 0 };
    return {
      x: pixelX / mapImage.width,
      y: pixelY / mapImage.height
    };
  };

  // 1) Auto-center on the current panorama's position whenever it or the image changes
  useEffect(() => {
    if (currentPanoramaData?.positionOnMinimap && mapImage) {
      const { x: normalizedX, y: normalizedY } = currentPanoramaData.positionOnMinimap;
      // Convert normalized coordinates to actual pixels
      const { x, y } = normalizedToPixel(normalizedX, normalizedY);

      const canvas = canvasRef.current;
      if (canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        setPan({
          x: centerX - x * zoom,
          y: centerY - y * zoom
        });
      }
    }
  }, [currentPanoramaData, mapImage, zoom]);

  // 2) Load the minimap image from mapData.minimapPath
  useEffect(() => {
    if (!mapData?.minimapPath) return;

    setLoading(true);
    const img = new Image();
    img.onload = () => {
      setMapImage(img);
      setLoading(false);
    };
    img.onerror = e => {
      console.error('Failed to load inline minimap image:', mapData.minimapPath, e);
      setError('Failed to load minimap image');
      setLoading(false);
    };
    img.src = getUploadedFileUrl(mapData.minimapPath);
  }, [mapData]);

  // 3) Draw the map + marker + tooltip on the canvas on every frame
  useEffect(() => {
    if (!canvasRef.current || !mapImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw floor map with pan/zoom
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(mapImage, 0, 0);

    // Draw the "current panorama" marker:
    if (currentPanoramaData?.positionOnMinimap) {
      const { x: normalizedX, y: normalizedY } = currentPanoramaData.positionOnMinimap;
      // Convert normalized coordinates to actual pixels
      const { x, y } = normalizedToPixel(normalizedX, normalizedY);

      // Shadow circle
      ctx.beginPath();
      ctx.arc(x, y + 1, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#FF4500';
      ctx.fill();
      // White border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Pulsing ring
      const pulseSize = 18 + Math.sin(Date.now() / 200) * 3;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 69, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Draw label background + text
      ctx.font = 'bold 12px Arial';
      const labelText = currentPanoramaData.title || 'Current Location';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(x - textWidth / 2 - 5, y - 28, textWidth + 10, 20);
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(labelText, x, y - 15);
    }

    // Draw mouse coordinate tooltip (if visible)
    if (mousePosition.visible) {
      // Convert screen coords → map coords
      const mapX = Math.round((mousePosition.x - pan.x) / zoom);
      const mapY = Math.round((mousePosition.y - pan.y) / zoom);

      // Convert to normalized coordinates for display
      const { x: normalizedX, y: normalizedY } = pixelToNormalized(mapX, mapY);

      ctx.resetTransform(); // draw in screen space

      // Show both pixel and normalized coordinates
      const coordText = `Pixel: ${mapX}, ${mapY} | Norm: ${normalizedX.toFixed(3)}, ${normalizedY.toFixed(3)}`;
      ctx.font = '12px Arial';
      const textWidth = ctx.measureText(coordText).width;
      // Position near cursor, but keep inside canvas
      let tooltipX = mousePosition.x + 15;
      let tooltipY = mousePosition.y - 10;
      if (tooltipX + textWidth + 10 > canvas.width) {
        tooltipX = mousePosition.x - textWidth - 15;
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(tooltipX, tooltipY, textWidth + 10, 24);
      ctx.fillStyle = '#FFF';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(coordText, tooltipX + 5, tooltipY + 12);

      // Draw crosshair at cursor
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

    // RequestAnimationFrame to keep pulsing ring animating
    if (currentPanoramaData?.positionOnMinimap) {
      requestAnimationFrame(() => {
        if (canvasRef.current) {
          const tmpCtx = canvasRef.current.getContext('2d');
          tmpCtx.clearRect(0, 0, 1, 1);
        }
      });
    }
  }, [mapImage, zoom, pan, currentPanoramaData, mousePosition]);

  //
  // Handlers for panning + zooming + mouse hover
  //
  const handleMouseDown = e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setIsDragging(true);
    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleMouseMove = e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setMousePosition({ x: mouseX, y: mouseY, visible: true });

    if (isDragging) {
      const dx = mouseX - dragStart.x;
      const dy = mouseY - dragStart.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setDragStart({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseEnter = () => setMousePosition(prev => ({ ...prev, visible: true }));
  const handleMouseLeave = () => {
    setIsDragging(false);
    setMousePosition(prev => ({ ...prev, visible: false }));
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  const handleReset = () => {
    setZoom(1);
    if (currentPanoramaData?.positionOnMinimap && canvasRef.current) {
      const { x: normalizedX, y: normalizedY } = currentPanoramaData.positionOnMinimap;
      const { x, y } = normalizedToPixel(normalizedX, normalizedY);
      const canvas = canvasRef.current;
      setPan({
        x: canvas.width / 2 - x,
        y: canvas.height / 2 - y
      });
    } else {
      setPan({ x: 0, y: 0 });
    }
  };

  const handleCenterOnCurrent = () => {
    if (currentPanoramaData?.positionOnMinimap && canvasRef.current) {
      const { x: normalizedX, y: normalizedY } = currentPanoramaData.positionOnMinimap;
      const { x, y } = normalizedToPixel(normalizedX, normalizedY);
      const canvas = canvasRef.current;
      setPan({
        x: canvas.width / 2 - x * zoom,
        y: canvas.height / 2 - y * zoom
      });
    }
  };

  //
  // Render loading / error / canvas + controls
  //
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading map...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!mapImage) {
    return (
      <div className="alert alert-warning">
        Map image not available.
      </div>
    );
  }

  return (
    <div className="minimap-inline" style={{ width: 1000, margin: '0 auto' }}>
      <div className="minimap-canvas-container">
        <canvas
          ref={canvasRef}
          width={1000}
          height={800}
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
          <Button
            variant="primary"
            onClick={handleCenterOnCurrent}
            title="Center on Current Location"
          >
            <i className="bi bi-geo-alt-fill"></i>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineMiniMap;