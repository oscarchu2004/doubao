import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import axios from 'axios';
import { baseURL } from '../../utils/baseUrl';
import './Header.css';

// Create context directly in this file
const MapContext = createContext();

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within Header');
  }
  return context;
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mapId } = useParams();

  // Map data state for context
  const [mapData, setMapData] = useState(null);

  // determine if we're on a map page and edit mode
  const isMapPage = location.pathname.includes('/map/');
  const isEditMode = location.pathname.includes('/edit');

  // clear map data when leaving map pages
  useEffect(() => {
    if (!isMapPage) {
      setMapData(null);
    }
  }, [isMapPage]);

  // Context functions
  const updateMapData = (data) => {
    setMapData(data);
  };

  const updateMapTitle = (newTitle) => {
    if (mapData) {
      setMapData(prev => ({
        ...prev,
        title: newTitle
      }));
    }
  };

  const handleModeToggle = () => {
    if (isEditMode) {
      navigate(`/map/${mapId}`);
    } else {
      navigate(`/map/${mapId}/edit`);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${baseURL}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const contextValue = {
    mapData,
    updateMapData,
    updateMapTitle
  };

  return (
    <MapContext.Provider value={contextValue}>
      <Navbar expand="lg">
        <Container>
          <Navbar.Brand onClick={handleLogoClick}>
            SHOMeHow
          </Navbar.Brand>

          <Nav className="ms-auto d-flex align-items-center">
            {isMapPage && mapData && (
              <>
                <div className="map-title-display me-3">
                  {mapData.title}
                </div>

                <Dropdown className="me-3">
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="mode-dropdown"
                    className="mode-toggle"
                  >
                    {isEditMode ? 'Edit Mode' : 'View Mode'}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item
                      onClick={handleModeToggle}
                      active={!isEditMode}
                    >
                      View Mode
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={handleModeToggle}
                      active={isEditMode}
                    >
                      Edit Mode
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}

            <Button
              variant="outline-danger"
              onClick={handleLogout}
              className="logout-btn"
            >
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>
      <Outlet />
    </MapContext.Provider>
  );
};

export default Header;