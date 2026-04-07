import React, { useState } from 'react';
import { Container, InputGroup, Form, Button } from 'react-bootstrap';
import { Search, ArrowRight } from 'react-bootstrap-icons';
import './Banner.css';

const Banner = ({ onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // call the search function passed from parent or handle search here
            if (onSearch) {
                onSearch(searchQuery.trim());
            } else {
                // default search behavior - could navigate to search results
                console.log('Searching for:', searchQuery);
            }
        }s
    };

    return (
        <div className="creative-header">
            <Container className="py-5 text-center">
                {/* Main headline */}
                <h1 className="creative-title mb-4">What will you create today ?</h1>

                {/* Search bar */}
                <div className="search-container mx-auto">
                    <Form onSubmit={handleSearch}>
                        <InputGroup>
                            <InputGroup.Text className="search-icon bg-white border-0">
                                <Search size={20} color="#8c8c8c" />
                            </InputGroup.Text>

                            <Form.Control
                                type="text"
                                placeholder="Search spaces"
                                aria-label="Search templates"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input border-0 shadow-none"
                            />

                            <Button
                                variant="link"
                                className="search-button"
                                type="submit"
                            >
                                <ArrowRight size={20} />
                            </Button>
                        </InputGroup>
                    </Form>
                </div>
            </Container>
        </div>
    );
};

export default Banner;