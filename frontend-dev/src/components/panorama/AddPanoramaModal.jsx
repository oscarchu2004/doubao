import React from 'react';
import { Modal } from 'react-bootstrap';
import AddPanoramaForm from '../AddPanoramaForm/AddPanoramaForm';


const AddPanoramaModal = ({ mapId, onClose }) => {
  return (
    <Modal show onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add a New Panorama</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Use the existing styled form */}
        <AddPanoramaForm
          mapId={mapId}
          onSuccess={() => {
            alert('✅ Panorama created successfully!');
            onClose();
            window.location.reload();
          }}
          onCancel={onClose}
        />
      </Modal.Body>
    </Modal>
  );
};

export default AddPanoramaModal;
