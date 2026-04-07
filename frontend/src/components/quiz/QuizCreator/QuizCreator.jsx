import React, { useState, useEffect } from 'react';
import { Modal, Tab, Tabs, Form, Button, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './QuizCreator.css';
import { baseURL } from '../../../utils/baseUrl';

const QuizCreator = ({ show, onHide, mapId }) => {
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [uploading, setUploading] = useState(false);

    // quiz form state
    const [quizForm, setQuizForm] = useState({
        title: '',
        description: '',
        passingScore: 75,
        questions: []
    });

    // Upload file to S3
    const uploadToS3 = async (file) => {
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await axios.post(
		// ADDED THIS LINE 
		`${baseURL}/upload/local`,
                formDataUpload,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                }
            );

            return response.data.url;
        } catch (error) {
            console.error('S3 upload failed:', error);
            throw new Error(error.response?.data?.error || 'Upload failed');
        }
    };

    // handle quiz form changes
    const handleQuizFormChange = (field, value) => {
        setQuizForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // add new question
    const addQuestion = () => {
        const newQuestion = {
            // id: Date.now(), // Temporary ID for frontend
            order: quizForm.questions.length + 1,
            questionText: '',
            options: [
                { text: '', imageUrl: '' },
                { text: '', imageUrl: '' },
                { text: '', imageUrl: '' },
                { text: '', imageUrl: '' }
            ], // Default 4 options as objects
            correctAnswerIndex: 0,
            answerExplanation: ''
        };

        setQuizForm(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    // remove question
    const removeQuestion = (index) => {
        const updatedQuestions = quizForm.questions.filter((_, i) => i !== index);
        // re-order remaining questions
        const reorderedQuestions = updatedQuestions.map((q, i) => ({
            ...q,
            order: i + 1
        }));

        setQuizForm(prev => ({
            ...prev,
            questions: reorderedQuestions
        }));
    };

    // handle question field changes
    const handleQuestionChange = (questionIndex, field, value) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex ? { ...q, [field]: value } : q
            )
        }));
    };

    // handle option changes (updated for object structure)
    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex ? {
                    ...q,
                    options: q.options.map((opt, j) =>
                        j === optionIndex ? { ...opt, [field]: value } : opt
                    )
                } : q
            )
        }));
    };

    // add option to question
    const addOption = (questionIndex) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex ? {
                    ...q,
                    options: [...q.options, { text: '', imageUrl: '' }]
                } : q
            )
        }));
    };

    // remove option from question (updated for object structure)
    const removeOption = (questionIndex, optionIndex) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex ? {
                    ...q,
                    options: q.options.filter((_, j) => j !== optionIndex),
                    correctAnswerIndex: q.correctAnswerIndex > optionIndex ?
                        q.correctAnswerIndex - 1 :
                        q.correctAnswerIndex >= q.options.length - 1 ? 0 : q.correctAnswerIndex
                } : q
            )
        }));
    };

    // handle image upload to Cloudinary
    const handleImageUpload = async (event, questionIndex, optionIndex) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setAlert({ show: false, message: '', type: '' });

            // validate file type
            if (!file.type.startsWith('image/')) {
                setAlert({
                    show: true,
                    message: 'Please select a valid image file',
                    type: 'danger'
                });
                return;
            }

            // validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setAlert({
                    show: true,
                    message: 'Image file must be less than 5MB',
                    type: 'danger'
                });
                return;
            }

            // Upload to S3
            const uploadedImageUrl = await uploadToS3(file);

            console.log('Image uploaded to S3:', uploadedImageUrl);

            // Clear text when setting image and update imageUrl
            setQuizForm(prev => ({
                ...prev,
                questions: prev.questions.map((q, i) =>
                    i === questionIndex ? {
                        ...q,
                        options: q.options.map((opt, j) =>
                            j === optionIndex ? { text: '', imageUrl: uploadedImageUrl } : opt
                        )
                    } : q
                )
            }));

            // Clear the file input to allow re-selection
            event.target.value = '';

            // show success message briefly
            setAlert({
                show: true,
                message: 'Image uploaded successfully!',
                type: 'success'
            });

            // clear success message after 2 seconds
            setTimeout(() => {
                setAlert({ show: false, message: '', type: '' });
            }, 2000);

        } catch (error) {
            console.error('Image upload error:', error);
            setAlert({
                show: true,
                message: error.message || 'Failed to upload image',
                type: 'danger'
            });
        } finally {
            setUploading(false);
        }
    };

    // remove image from option
    const removeImage = (questionIndex, optionIndex) => {
        setQuizForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) =>
                i === questionIndex ? {
                    ...q,
                    options: q.options.map((opt, j) =>
                        j === optionIndex ? { ...opt, imageUrl: '' } : opt
                    )
                } : q
            )
        }));
    };

    // drag and drop functionality
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) return;

        const draggedQuestion = quizForm.questions[draggedIndex];
        const updatedQuestions = [...quizForm.questions];

        // remove dragged item
        updatedQuestions.splice(draggedIndex, 1);

        // insert at new position
        updatedQuestions.splice(dropIndex, 0, draggedQuestion);

        // update order numbers
        const reorderedQuestions = updatedQuestions.map((q, i) => ({
            ...q,
            order: i + 1
        }));
        setQuizForm(prev => ({
            ...prev,
            questions: reorderedQuestions
        }));

        setDraggedIndex(null);
    };

    // create quiz and questions
    const createQuiz = async () => {
        try {
            setLoading(true);
            setAlert({ show: false, message: '', type: '' });

            // validate form
            if (!quizForm.title.trim()) {
                throw new Error('Quiz title is required');
            }

            if (quizForm.questions.length === 0) {
                throw new Error('At least one question is required');
            }

            // validate each question (updated for object structure)
            quizForm.questions.forEach((q, i) => {
                if (!q.questionText.trim()) {
                    throw new Error(`Question ${i + 1}: Question text is required`);
                }
                if (q.options.length < 2) {
                    throw new Error(`Question ${i + 1}: At least 2 options are required`);
                }

                // Validate each option has either text or image
                q.options.forEach((opt, j) => {
                    const hasText = opt.text && opt.text.trim();
                    const hasImage = opt.imageUrl && opt.imageUrl.trim();

                    if (!hasText && !hasImage) {
                        throw new Error(`Question ${i + 1}, Option ${j + 1}: Must have either text or image`);
                    }
                });

                if (q.correctAnswerIndex >= q.options.length || q.correctAnswerIndex < 0) {
                    throw new Error(`Question ${i + 1}: Invalid correct answer selected`);
                }
            });

            // 1: create Quiz
            const quizData = {
                mapId: mapId,
                title: quizForm.title,
                description: quizForm.description,
                passingScore: quizForm.passingScore
            };

            let quizId = null;
            let quizCreated = false;

            try {
                const quizResponse = await axios.post(
                    `${baseURL}/quiz/create`,
                    quizData,
                    {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const createdQuiz = quizResponse.data.quiz;
                if (!createdQuiz || !createdQuiz._id) {
                    throw new Error('Quiz creation failed - no quiz ID returned');
                }

                quizId = createdQuiz._id;
                quizCreated = true;

            } catch (error) {
                const errorMessage = error.response?.data?.error || error.message || 'Failed to create quiz';
                throw new Error(`Quiz Creation Failed: ${errorMessage}`);
            }

            // step 2: Create Questions
            let questionResults = {
                successful: [],
                failed: []
            };

            for (let i = 0; i < quizForm.questions.length; i++) {
                const question = quizForm.questions[i];
                const questionNumber = i + 1;

                try {
                    const questionData = {
                        quizId: quizId,
                        questionText: question.questionText,
                        options: question.options, // Now sending objects instead of strings
                        correctAnswerIndex: question.correctAnswerIndex,
                        answerExplanation: question.answerExplanation
                    };

                    const questionResponse = await axios.post(
                        `${baseURL}/questions/create`,
                        questionData,
                        {
                            withCredentials: true,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    // check if question was created successfully
                    if (questionResponse.data.question && questionResponse.data.question._id) {
                        questionResults.successful.push({
                            number: questionNumber,
                            text: question.questionText.substring(0, 50) + '...',
                            id: questionResponse.data.question._id
                        });
                    } else {
                        throw new Error('Question created but no ID returned');
                    }

                } catch (error) {
                    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
                    questionResults.failed.push({
                        number: questionNumber,
                        text: question.questionText.substring(0, 50) + '...',
                        error: errorMessage
                    });
                }
            }

            // step 3: Display Results
            const totalQuestions = quizForm.questions.length;
            const successfulCount = questionResults.successful.length;
            const failedCount = questionResults.failed.length;

            if (failedCount === 0) {
                // Complete success
                setAlert({
                    show: true,
                    message: ` Quiz "${quizForm.title}" created successfully with ${successfulCount} questions!`,
                    type: 'success'
                });

                // Reset form
                setQuizForm({
                    title: '',
                    description: '',
                    passingScore: 75,
                    questions: []
                });

                // Close modal after delay
                setTimeout(() => {
                    onHide();
                }, 2000);

            } else if (successfulCount > 0) {
                // Partial success
                const failedDetails = questionResults.failed
                    .map(f => `Question ${f.number}: ${f.error}`)
                    .join('; ');

                setAlert({
                    show: true,
                    message: ` Quiz "${quizForm.title}" created with ${successfulCount}/${totalQuestions} questions. Failed questions: ${failedDetails}`,
                    type: 'warning'
                });

            } else {
                // All questions failed
                const failedDetails = questionResults.failed
                    .map(f => `Question ${f.number}: ${f.error}`)
                    .join('; ');

                setAlert({
                    show: true,
                    message: ` Quiz "${quizForm.title}" was created but ALL questions failed. Errors: ${failedDetails}`,
                    type: 'danger'
                });
            }

        } catch (error) {
            // Handle quiz creation failure or validation errors
            setAlert({
                show: true,
                message: `${error.message}`,
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!show) {
            setQuizForm({
                title: '',
                description: '',
                passingScore: 75,
                questions: []
            });
            setAlert({ show: false, message: '', type: '' });
        }
    }, [show]);

    return (
        <Modal
            show={show}
            onHide={onHide}
            size="xl"
            className="quiz-creator-modal"
            backdrop="static"
        >
            <Modal.Header closeButton>
                <Modal.Title>Create Quiz</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {alert.show && (
                    <Alert variant={alert.type} className="quiz-creator-alert">
                        {alert.message}
                    </Alert>
                )}

                <Form className="quiz-creator-form">
                    {/* Quiz Information */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Quiz Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={8}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Quiz Title *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={quizForm.title}
                                            onChange={(e) => handleQuizFormChange('title', e.target.value)}
                                            placeholder="Enter quiz title"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Passing Score (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={quizForm.passingScore}
                                            onChange={(e) => handleQuizFormChange('passingScore', parseInt(e.target.value))}
                                            min="0"
                                            max="100"
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={quizForm.description}
                                    onChange={(e) => handleQuizFormChange('description', e.target.value)}
                                    placeholder="Describe what this quiz tests"
                                />
                            </Form.Group>
                        </Card.Body>
                    </Card>

                    {/* Questions Section */}
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Questions ({quizForm.questions.length})</h5>
                            <Button
                                variant="outline-primary"
                                onClick={addQuestion}
                            >
                                <i className="bi bi-plus me-1"></i>
                                Add Question
                            </Button>
                        </Card.Header>
                        <Card.Body>
                            {quizForm.questions.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-question-circle display-4 mb-3"></i>
                                    <p>No questions added yet. Click "Add Question" to get started.</p>
                                </div>
                            ) : (
                                quizForm.questions.map((question, questionIndex) => (
                                    <Card
                                        key={question.id}
                                        className={`mb-3 question-card ${draggedIndex === questionIndex ? 'dragging' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, questionIndex)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, questionIndex)}
                                    >
                                        <Card.Header className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-grip-vertical me-2 mb-2 text-muted drag-handle"></i>
                                                <h6>Question {question.order}</h6>
                                            </div>
                                            <Button
                                                variant="outline-danger"
                                                onClick={() => removeQuestion(questionIndex)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </Card.Header>
                                        <Card.Body>
                                            {/* Question Text */}
                                            <Form.Group className="mb-3">
                                                <Form.Label>Question Text *</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    value={question.questionText}
                                                    onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                                                    placeholder="Enter your question here"
                                                />
                                            </Form.Group>

                                            {/* Options */}
                                            <Form.Group className="mb-3">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <Form.Label className="mb-0">Answer Options</Form.Label>
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() => addOption(questionIndex)}
                                                    >
                                                        <i className="bi bi-plus me-1"></i>
                                                        Add Option
                                                    </Button>
                                                </div>

                                                {question.options.map((option, optionIndex) => (
                                                    <div key={optionIndex} className="mb-2">
                                                        <Row className="align-items-center">
                                                            <Col md={1}>
                                                                <Form.Check
                                                                    type="radio"
                                                                    name={`correct-${questionIndex}`}
                                                                    checked={question.correctAnswerIndex === optionIndex}
                                                                    onChange={() => handleQuestionChange(questionIndex, 'correctAnswerIndex', optionIndex)}
                                                                    title="Mark as correct answer"
                                                                />
                                                            </Col>
                                                            <Col md={8}>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={option.text}
                                                                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, 'text', e.target.value)}
                                                                    placeholder={`Option ${optionIndex + 1} text`}
                                                                    disabled={option.imageUrl && option.imageUrl.trim()} // Disable text input if image is selected
                                                                />
                                                                {option.imageUrl && (
                                                                    <div className="mt-2">
                                                                        <div className="mb-2">
                                                                            <img
                                                                                src={option.imageUrl}
                                                                                alt={`Option ${optionIndex + 1}`}
                                                                                style={{
                                                                                    maxWidth: '200px',
                                                                                    maxHeight: '150px',
                                                                                    objectFit: 'cover',
                                                                                    borderRadius: '4px',
                                                                                    border: '1px solid #dee2e6'
                                                                                }}
                                                                                className="img-thumbnail"
                                                                            />
                                                                        </div>
                                                                        {/* <Button
                                                                            variant="link"
                                                                            className="p-0 text-danger"
                                                                            onClick={() => removeImage(questionIndex, optionIndex)}
                                                                        >
                                                                            <i className="bi bi-trash me-1"></i>
                                                                            Remove Image
                                                                        </Button> */}
                                                                    </div>
                                                                )}
                                                            </Col>
                                                            <Col md={2}>
                                                                <Button
                                                                    variant="outline-secondary"
                                                                    onClick={() => document.getElementById(`option-upload-${questionIndex}-${optionIndex}`).click()}
                                                                    disabled={option.text && option.text.trim()} // Disable image upload if text is entered
                                                                >
                                                                    <i className="bi bi-image me-1"></i>
                                                                    Image
                                                                </Button>
                                                                <input
                                                                    id={`option-upload-${questionIndex}-${optionIndex}`}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => handleImageUpload(e, questionIndex, optionIndex)}
                                                                />
                                                            </Col>
                                                            <Col md={1}>
                                                                {question.options.length > 2 && (
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        onClick={() => removeOption(questionIndex, optionIndex)}
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </Button>
                                                                )}
                                                            </Col>
                                                        </Row>
                                                    </div>
                                                ))}
                                            </Form.Group>

                                            {/* Answer Explanation */}
                                            <Form.Group className="mb-0">
                                                <Form.Label>Answer Explanation</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    value={question.answerExplanation}
                                                    onChange={(e) => handleQuestionChange(questionIndex, 'answerExplanation', e.target.value)}
                                                    placeholder="Explain why this is the correct answer"
                                                />
                                            </Form.Group>
                                        </Card.Body>
                                    </Card>
                                ))
                            )}
                        </Card.Body>
                    </Card>
                </Form>
            </Modal.Body>
            <Modal.Footer className="d-block">
                <div className="d-flex flex-column w-100">
                    <Button
                        className="quiz-primary-btn w-100 mb-1"
                        onClick={createQuiz}
                        disabled={loading || !quizForm.title.trim() || quizForm.questions.length === 0}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Creating Quiz...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check me-2"></i>
                                Create Quiz
                            </>
                        )}
                    </Button>

                    {/* "or" separator line */}
                    <div
                        className="mb-3"
                        style={{
                            width: '100%',
                            height: '15px',
                            borderBottom: '0.5px solid #8E8D8D',
                            textAlign: 'center'
                        }}
                    >
                        <span
                            style={{
                                fontSize: '13px',
                                color: '#8E8D8D',
                                backgroundColor: 'white',
                                padding: '0 5px'
                            }}
                        >
                            or
                        </span>
                    </div>

                    <Button
                        className="quiz-secondary-btn w-100"
                        onClick={onHide}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default QuizCreator;
