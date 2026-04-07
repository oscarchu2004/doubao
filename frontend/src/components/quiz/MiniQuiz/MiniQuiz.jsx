import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import './MiniQuiz.css';
import QuestionCard from '../QuestionCard/QuestionCard';
import { baseURL } from '../../../utils/baseUrl';

const MiniQuiz = ({ show, questions, onClose, onComplete, selectedQuiz, currentMapId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [showExplanation, setShowExplanation] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        if (show) {
            setCurrentIndex(0);
            setUserAnswers({});
            setShowExplanation(false);
            setErrorMessage('');
            setIsCorrect(false);
        }
    }, [show]);

    const handleSelectAnswer = (questionId, answerIndex) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answerIndex }));

        const question = questions[currentIndex];
        const isRight = answerIndex === question.correctAnswerIndex;

        if (isRight) {
            setShowExplanation(true);
            setErrorMessage('');
            setIsCorrect(true);
        } else {
            setErrorMessage("That's not correct.Please try again before proceeding.");
            setShowExplanation(false);
            setIsCorrect(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowExplanation(false);
            setErrorMessage('');
            setIsCorrect(false);
        } else {
            handleSubmitQuiz(); // Call backend and complete challenge
        }
    };

    const handleSubmitQuiz = useCallback(async () => {
        try {
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : null;

            if (!user || !user.userId) {
                console.error('User not found in localStorage');
                // Still allow completion for challenge flow
                if (onComplete) {
                    onComplete(true); // Assume passed since all questions were answered correctly
                }
                return;
            }

            const score = 100; // Since all answers must be correct to proceed
            const passed = true;

            // Save quiz result to backend
            const response = await axios.post(`${baseURL}/quiz-results/`, {
                userId: user.userId,
                quizId: selectedQuiz,
                mapId: currentMapId,
                score,
                passed,
            }, { withCredentials: true });

            console.log('Quiz result saved:', response.data);

            // Call completion handler with success
            if (onComplete) {
                onComplete(true);
            }
        } catch (error) {
            console.error('Error saving quiz result:', error);

            // Even if saving fails, still allow challenge completion
            // since user answered questions correctly
            if (onComplete) {
                onComplete(true);
            }
        }
    }, [selectedQuiz, currentMapId, onComplete]);

    // Handle modal close - this indicates user cancelled/failed the challenge
    const handleClose = useCallback(() => {
        console.log("MiniQuiz modal closed - challenge cancelled");

        // Reset states
        setCurrentIndex(0);
        setUserAnswers({});
        setShowExplanation(false);
        setErrorMessage('');
        setIsCorrect(false);

        // Call onClose to close modal
        if (onClose) {
            onClose();
        }

        // Note: We don't call onComplete(false) here because user just closed modal
        // The PanoramaViewer will handle clearing pending states when modal closes
    }, [onClose]);

    // Handle cases where there are no questions
    if (!questions || questions.length === 0) {
        return (
            <Modal show={show} onHide={handleClose} centered backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Challenge</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="alert alert-warning">
                        No challenge questions available. Access granted.
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => onComplete && onComplete(true)}>
                        Continue
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" dialogClassName="responsive-modal">
            <Modal.Header closeButton>
                <Modal.Title>Complete This Challenge to Proceed</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ProgressBar now={progress} className="mb-4" variant="primary" />

                {currentQuestion && (
                    <QuestionCard
                        question={currentQuestion}
                        selectedAnswer={userAnswers[currentQuestion._id]}
                        onSelectAnswer={handleSelectAnswer}
                        isEditMode={false}
                        layout="row"
                    />
                )}

                {showExplanation && currentQuestion?.answerExplanation && (
                    <div className="alert alert-info mt-3">
                        <strong>Explanation:</strong> {currentQuestion.answerExplanation}
                    </div>
                )}

                {errorMessage && (
                    <div className="alert alert-warning mt-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {errorMessage}
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center mt-4">
                    <span className="text-muted">
                        Question {currentIndex + 1} of {questions.length}
                    </span>

                    <Button
                        variant="primary"
                        disabled={!isCorrect}
                        onClick={handleNext}
                    >
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Challenge'}
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default MiniQuiz;