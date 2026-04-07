import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Offcanvas, Button, ProgressBar, Alert, Card } from 'react-bootstrap';
import axios from 'axios';
import { baseURL } from '../../../utils/baseUrl';
import QuestionCard from '../QuestionCard/QuestionCard';
import DeleteConfirmationModal from '../../DeleteConfirmationModal/DeleteConfirmationModal';
import './QuizPanel.css';

const QuizPanel = ({ show, handleClose, isEditMode }) => {
    // state management
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previousResult, setPreviousResult] = useState(null);
    const [loadingResults, setLoadingResults] = useState(false);

    // delete confirmation state
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        type: null, // 'quiz'
        item: null,
        loading: false
    });

    // get current map ID from URL
    const currentMapId = useMemo(() => {
        const pathSegments = location.pathname.split('/');
        const mapIdIndex = pathSegments.findIndex(segment => segment === 'map') + 1;
        return mapIdIndex < pathSegments.length ? pathSegments[mapIdIndex] : null;
    }, [location.pathname]);

    // get user data from localStorage
    const getUserData = useCallback(() => {
        const userString = localStorage.getItem('user');
        if (!userString) return null;

        try {
            return JSON.parse(userString);
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }, []);

    // fetch quizzes when panel is shown
    useEffect(() => {
        const fetchQuizzes = async () => {
            if (!show || !currentMapId) {
                !currentMapId && setError('Map ID not found in URL');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${baseURL}/quiz/map/${currentMapId}`, {
                    withCredentials: true
                });

                setQuizzes(response.data.quizzes);
                // Removed auto-selection - always show quiz selector
            } catch (err) {
                console.error('Error fetching quizzes:', err);
                setError('Failed to load quizzes');
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, [show, currentMapId]);

    // fetch questions when a quiz is selected
    useEffect(() => {
        const fetchQuestions = async () => {
            if (!selectedQuiz) return;

            try {
                setLoading(true);
                const response = await axios.get(`${baseURL}/questions/quiz/${selectedQuiz._id}`, {
                    withCredentials: true
                });

                // Shuffle questions
                const shuffledQuestions = [...response.data.questions].sort(() => Math.random() - 0.5);
                setQuestions(shuffledQuestions);
            } catch (err) {
                console.error('Error fetching questions:', err);
                setError('Failed to load quiz questions');
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [selectedQuiz]);

    // fetch previous results
    useEffect(() => {
        const fetchPreviousResults = async () => {
            if (!selectedQuiz) return;

            try {
                setLoadingResults(true);
                const user = getUserData();

                if (!user || !user.userId) {
                    setLoadingResults(false);
                    return;
                }

                const response = await axios.get(
                    `${baseURL}/quiz-results/check/${user.userId}/${selectedQuiz._id}`,
                    { withCredentials: true }
                );

                setPreviousResult(response.data.result);
            } catch (error) {
                console.error('Error fetching previous quiz results:', error);
            } finally {
                setLoadingResults(false);
            }
        };

        fetchPreviousResults();
    }, [selectedQuiz, getUserData]);

    // handle delete quiz click
    const handleDeleteClick = (quiz) => {
        setDeleteModal({
            show: true,
            type: 'quiz',
            item: quiz,
            loading: false
        });
    };

    // handle delete quiz confirm
    const handleDeleteConfirm = async () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));

        try {
            const { item } = deleteModal;

            // delete the quiz
            await axios.delete(`${baseURL}/quiz/delete/${item._id}`, {
                withCredentials: true
            });

            // update local state
            setQuizzes(prev => prev.filter(q => q._id !== item._id));

            // reset selection if deleted quiz was selected
            if (selectedQuiz && selectedQuiz._id === item._id) {
                setSelectedQuiz(null);
                setQuizStarted(false);
                setQuizCompleted(false);
            }
            setDeleteModal({ show: false, type: null, item: null, loading: false });
        } catch (err) {
            console.error('Error deleting quiz:', err);
            setError('Failed to delete quiz');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    // handle delete quiz cancel
    const handleDeleteCancel = () => {
        setDeleteModal({ show: false, type: null, item: null, loading: false });
    };

    // handle back to quiz selector
    const handleBackToSelector = useCallback(() => {
        setSelectedQuiz(null);
        setQuizStarted(false);
        setQuizCompleted(false);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setScore(0);
        setPreviousResult(null);
    }, []);

    // reset quiz state when starting
    const handleStartQuiz = useCallback(() => {
        setQuizStarted(true);
        setQuizCompleted(false);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setScore(0);
    }, []);

    // handle answer selection
    const handleSelectAnswer = useCallback((questionId, answerIndex) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answerIndex
        }));
    }, []);

    // navigation handlers
    const handleNextQuestion = useCallback(() => {
        setCurrentQuestionIndex(prev =>
            prev < questions.length - 1 ? prev + 1 : prev
        );
    }, [questions.length]);

    const handlePreviousQuestion = useCallback(() => {
        setCurrentQuestionIndex(prev => prev > 0 ? prev - 1 : prev);
    }, []);

    // submit quiz and save results
    const handleSubmitQuiz = useCallback(async () => {
        const user = getUserData();

        if (!user || !user.userId) {
            console.error('User not found in localStorage');
            return;
        }

        // calculate score
        let correctAnswers = 0;
        const answerDetails = [];

        questions.forEach(question => {
            const userAnswerIndex = selectedAnswers[question._id];
            const isCorrect = userAnswerIndex === question.correctAnswerIndex;

            if (isCorrect) correctAnswers++;

            answerDetails.push({
                questionId: question._id,
                userAnswerIndex,
                isCorrect
            });
        });

        const calculatedScore = Math.round((correctAnswers / questions.length) * 100);
        const isPassed = calculatedScore >= (selectedQuiz.passingScore || 70);

        setScore(calculatedScore);
        setQuizCompleted(true);

        try {
            // save results to server
            const response = await axios.post(`${baseURL}/quiz-results/`, {
                userId: user.userId,
                quizId: selectedQuiz._id,
                mapId: currentMapId,
                score: calculatedScore,
                passed: isPassed,
                answers: answerDetails
            }, { withCredentials: true });

            console.log('Quiz result saved:', response.data);
        } catch (error) {
            console.error('Error saving quiz result:', error);
        }
    }, [questions, selectedAnswers, selectedQuiz, currentMapId, getUserData]);

    // render quiz intro screen
    const renderQuizIntro = useCallback(() => {
        if (!selectedQuiz) return null;

        const hasPassed = previousResult && previousResult.passed;

        return (
            <div className="text-center py-4">
                <div className="mb-4">
                    <i className="bi bi-question-circle-fill text-primary" style={{ fontSize: '5rem' }}></i>
                </div>

                <h4 className="mb-3">{selectedQuiz.title}</h4>

                {selectedQuiz.description && (
                    <p className="mb-4">{selectedQuiz.description}</p>
                )}

                <div className="d-flex justify-content-center mb-2">
                    <div className="text-muted small me-3">
                        <i className="bi bi-list-check me-1"></i>
                        {questions.length} Questions
                    </div>
                    <div className="text-muted small">
                        <i className="bi bi-trophy me-1"></i>
                        Pass Score: {selectedQuiz.passingScore}%
                    </div>
                </div>

                {/* Previous Result Section */}
                {loadingResults ? (
                    <div className="my-4">
                        <div className="spinner-border spinner-border-sm text-secondary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="ms-2 text-muted">Checking previous attempts...</span>
                    </div>
                ) : previousResult ? (
                    <div className={`my-4 p-3 rounded border ${hasPassed ? 'border-success bg-success bg-opacity-10' : 'border-warning bg-warning bg-opacity-10'}`}>
                        <div className="d-flex align-items-center justify-content-center">
                            {hasPassed ? (
                                <i className="bi bi-trophy-fill text-success me-2" style={{ fontSize: '1.5rem' }}></i>
                            ) : (
                                <i className="bi bi-exclamation-circle text-warning me-2" style={{ fontSize: '1.5rem' }}></i>
                            )}
                            <div className="text-start">
                                <h5 className="mb-1">
                                    {hasPassed ? 'Quiz Passed' : 'Previous Attempt'}
                                </h5>
                                <p className="mb-0">
                                    Score: <strong>{previousResult.score}%</strong> •
                                    Completed: <strong>{new Date(previousResult.completedAt).toLocaleDateString()}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button
                        variant="outline-secondary"
                        onClick={handleBackToSelector}
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Back to Quizzes
                    </Button>
                    <Button
                        variant={hasPassed ? "outline-success" : "primary"}
                        size="lg"
                        className="px-5"
                        onClick={handleStartQuiz}
                        disabled={loadingResults}
                    >
                        {hasPassed ? "Retake Quiz" : "Start Quiz"}
                    </Button>
                </div>
            </div>
        );
    }, [selectedQuiz, questions.length, loadingResults, previousResult, handleStartQuiz, handleBackToSelector]);

    // render current question 
    const renderQuizQuestion = useCallback(() => {
        const question = questions[currentQuestionIndex];
        if (!question) return null;

        const isAnswered = selectedAnswers[question._id] !== undefined;

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="text-muted">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </div>
                    <div className="text-muted">
                        {Object.keys(selectedAnswers).length} of {questions.length} answered
                    </div>
                </div>

                <ProgressBar
                    now={(currentQuestionIndex + 1) / questions.length * 100}
                    className="mb-4"
                    style={{ height: "8px" }}
                />

                <QuestionCard
                    question={question}
                    selectedAnswer={selectedAnswers[question._id]}
                    onSelectAnswer={handleSelectAnswer}
                    isEditMode={false}
                />

                <div className="d-flex justify-content-between">
                    <Button
                        variant="outline-secondary"
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Previous
                    </Button>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={handleNextQuestion}
                            disabled={!isAnswered}
                        >
                            Next
                            <i className="bi bi-arrow-right ms-1"></i>
                        </Button>
                    ) : (
                        <Button
                            variant="success"
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(selectedAnswers).length !== questions.length}
                        >
                            Submit Quiz
                        </Button>
                    )}
                </div>
            </div>
        );
    }, [
        questions,
        currentQuestionIndex,
        selectedAnswers,
        handleSelectAnswer,
        handlePreviousQuestion,
        handleNextQuestion,
        handleSubmitQuiz
    ]);

    // render quiz results
    const renderQuizResults = useCallback(() => {
        if (!selectedQuiz) return null;

        const isPassed = score >= (selectedQuiz.passingScore || 70);
        const correctAnswersCount = Object.keys(selectedAnswers).filter(
            qId => selectedAnswers[qId] === questions.find(q => q._id === qId)?.correctAnswerIndex
        ).length;

        return (
            <div className="text-center py-4">
                <div className="mb-4">
                    {isPassed ? (
                        <i className="bi bi-trophy-fill text-success" style={{ fontSize: '5rem' }}></i>
                    ) : (
                        <i className="bi bi-emoji-frown text-danger" style={{ fontSize: '5rem' }}></i>
                    )}
                </div>

                <h4 className="mb-3">Quiz Completed</h4>

                <div className="score-display mb-4">
                    <div className="display-4 mb-2">{score}%</div>
                    <div className={isPassed ? 'text-success' : 'text-danger'}>
                        {isPassed ? 'Passed!' : 'Not Passed'}
                    </div>
                    <div className="text-muted mt-1">
                        Passing score: {selectedQuiz.passingScore || 70}%
                    </div>
                </div>

                <div className="result-details mb-4">
                    <div>Correct answers: {correctAnswersCount}</div>
                    <div>Total questions: {questions.length}</div>
                </div>

                <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button
                        variant="outline-secondary"
                        onClick={handleBackToSelector}
                    >
                        <i className="bi bi-arrow-left me-1"></i>
                        Back to Quizzes
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleStartQuiz}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }, [selectedQuiz, score, selectedAnswers, questions, handleStartQuiz, handleBackToSelector]);

    // render quiz selector
    const renderQuizSelector = useCallback(() => {
        return (
            <div className="text-center py-4">
                <div className="mb-4">
                    <i className="bi bi-journal-check text-primary" style={{ fontSize: '5rem' }}></i>
                </div>

                <h4 className="mb-4">Select a Quiz</h4>

                <div className="quiz-list">
                    {quizzes.map(quiz => (
                        <Card
                            key={quiz._id}
                            className="mb-3"
                        >
                            <Card.Body className="d-flex justify-content-between align-items-center">
                                <div
                                    className="flex-grow-1 cursor-pointer"
                                    onClick={() => setSelectedQuiz(quiz)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <h5 className="mb-1">{quiz.title}</h5>
                                    {quiz.description && (
                                        <p className="mb-0 text-muted small">{quiz.description}</p>
                                    )}
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    {isEditMode && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(quiz);
                                            }}
                                            title="Delete Quiz"
                                        >
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
                                    <i className="bi bi-chevron-right"></i>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }, [quizzes, isEditMode, handleDeleteClick]);

    // determine which content to show
    const renderContent = useCallback(() => {
        if (loading) {
            return (
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading quiz...</p>
                </div>
            );
        }

        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }

        if (quizzes.length === 0) {
            return (
                <div className="text-center py-5">
                    <div className="mb-4">
                        <i className="bi bi-emoji-neutral text-muted" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <p className="text-muted">No quizzes available for this map.</p>
                </div>
            );
        }

        if (!selectedQuiz) {
            return renderQuizSelector();
        }

        if (!quizStarted) {
            return renderQuizIntro();
        }

        if (quizCompleted) {
            return renderQuizResults();
        }

        return renderQuizQuestion();
    }, [
        loading,
        error,
        quizzes,
        selectedQuiz,
        quizStarted,
        quizCompleted,
        renderQuizSelector,
        renderQuizIntro,
        renderQuizResults,
        renderQuizQuestion
    ]);

    return (
        <>
            <Offcanvas show={show} onHide={handleClose} placement="end" backdrop={false}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                        Quiz
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {renderContent()}
                </Offcanvas.Body>
            </Offcanvas>

            <DeleteConfirmationModal
                show={deleteModal.show}
                onHide={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                type="quiz"
                itemName={deleteModal.item?.title}
                loading={deleteModal.loading}
            />
        </>
    );
};

export default QuizPanel;