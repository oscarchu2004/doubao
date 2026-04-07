import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form } from 'react-bootstrap';
import MapCardHomePage from '../../components/MapCardHomePage/MapCardHomePage';
import axios from 'axios';
import Banner from '../../components/Banner/Banner';
import CreateMapButton from '../../components/CreateMapButton/CreateMapButton';
import { baseURL } from '../../utils/baseUrl';
import { formatLastEdited } from '../../utils/helperFunction';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [maps, setMaps] = useState([]);
  const [filteredMaps, setFilteredMaps] = useState([]); // Add this state
  const [searchQuery, setSearchQuery] = useState(''); // Add this state
  const [sortBy, setSortBy] = useState('title');

  // redirect to login if not authenticated
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // fetch maps
  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const user = JSON.parse(stored);
        if (!user.userId) return;
        const { data } = await axios.get(
          `${baseURL}/maps/creator/${user.userId}`,
          { withCredentials: true }
        );
        setMaps(data.maps);
        setFilteredMaps(data.maps); // Initialize filtered maps
      } catch (err) {
        console.error('Error fetching maps:', err);
      }
    };
    fetchMaps();
  }, []);

  // sort handler
  const handleSort = e => setSortBy(e.target.value);

  // handle map deletion
  const handleMapDeleted = (deletedMapId) => {
    // remove the deleted map from both arrays
    setMaps(prevMaps => prevMaps.filter(map => map._id !== deletedMapId));
    setFilteredMaps(prevMaps => prevMaps.filter(map => map._id !== deletedMapId));
  };

  // handle search from banner
  const handleBannerSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      // If search is empty, show all maps
      setFilteredMaps(maps);
    } else {
      // Filter maps based on search query
      const filtered = maps.filter(map =>
        map.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMaps(filtered);
    }
  };

  // apply sorting to filtered maps (not all maps)
  const sortedMaps = [...filteredMaps].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="homepage">
      {/* Main Header */}
      <Banner onSearch={handleBannerSearch} />

      {/* Content Section */}
      <Container className="mt-5 bg-white pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title ">
            My Maps
          </h2>
          <div className="d-flex">
            <Form.Select
              value={sortBy}
              onChange={handleSort}
              style={{ width: '200px' }}
            >
              <option value="title">Sort by Title</option>
              <option value="lastEdited">Sort by Last Edited</option>
            </Form.Select>
          </div>
        </div>

        <Row className="g-4">
          <CreateMapButton />
          {sortedMaps.length > 0 ? (
            sortedMaps.map(map => (
              <MapCardHomePage
                key={map._id}
                design={{
                  id: map._id,
                  title: map.title,
                  type: 'Map',
                  edited: formatLastEdited(map.updatedAt),
                  isPublic: map.isPublic,
                  thumbnailPath: map.thumbnailPath
                }}
                onMapDeleted={handleMapDeleted}
              />
            ))
          ) : (
            <Col>
              <div className="text-center py-5">
                {searchQuery ? (
                  <div>
                    <p>No maps found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <div>
                    <p>You haven't created any maps yet.</p>
                    <p>Click "Create New" to get started!</p>
                  </div>
                )}
              </div>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;