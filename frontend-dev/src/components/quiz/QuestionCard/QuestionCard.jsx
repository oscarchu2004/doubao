import React from 'react';
import { Card } from 'react-bootstrap';
import './QuestionCard.css';

const QuestionCard = ({
    question,
    selectedAnswer,
    onSelectAnswer,
    isEditMode = false,
    onQuestionTextChange,
    onOptionTextChange,
    onCorrectAnswerChange,
    layout
}) => {
    if (!question) return null;
    const columnClass = layout === 'row' ? 'col-3' : (question.options.length <= 2 ? 'col-12' : 'col-6');

    // Helper function to render option content
    const renderOptionContent = (option, index) => {
        // Check if option has text content
        if (option.text && option.text.trim() !== '') {
            return <span>{option.text}</span>;
        }

        // Check if option has imageUrl
        if (option.imageUrl) {
            return (
                <img
                    src={option.imageUrl}
                    alt={`Option ${index + 1}`}
                    className="img-fluid rounded quiz-option-image"
                />
            );
        }

        // Fallback if no content
        return <span className="text-muted">No content</span>;
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                {isEditMode ? (
                    <textarea
                        className="form-control mb-4 fw-bold"
                        value={question.questionText}
                        onChange={(e) => onQuestionTextChange(question._id, e.target.value)}
                        placeholder="Enter your question here"
                    />
                ) : (
                    <Card.Title className="mb-4">{question.questionText}</Card.Title>
                )}

                <div className="options-container">
                    <div className="row g-2">
                        {question.options.map((option, index) => (
                            <div key={index} className={columnClass}>
                                <div
                                    className={`option-card p-3 border rounded h-100 d-flex ${!isEditMode && 'align-items-center justify-content-center'
                                        } ${selectedAnswer === index ? 'selected-option' : ''
                                        }`}
                                    onClick={() => !isEditMode && onSelectAnswer(question._id, index)}
                                    style={{
                                        cursor: isEditMode ? 'default' : 'pointer',
                                        backgroundColor: selectedAnswer === index ? '#f0f7ff' : 'white',
                                        borderColor: selectedAnswer === index ? '#0d6efd' : '#dee2e6',
                                        transition: 'all 0.2s ease',
                                        // minHeight: '120px' // Ensure consistent height for image options
                                    }}
                                >
                                    {isEditMode ? (
                                        <div className="w-100">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name={`correct-answer-${question._id}`}
                                                        checked={question.correctAnswerIndex === index}
                                                        onChange={() => onCorrectAnswerChange(question._id, index)}
                                                    />
                                                    <label className="form-check-label">Correct Answer</label>
                                                </div>
                                            </div>
                                            <textarea
                                                className="form-control mb-2"
                                                value={option.text || ''}
                                                onChange={(e) => onOptionTextChange(question._id, index, {
                                                    ...option,
                                                    text: e.target.value
                                                })}
                                                placeholder={`Option ${index + 1} text`}
                                            />
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={option.imageUrl || ''}
                                                onChange={(e) => onOptionTextChange(question._id, index, {
                                                    ...option,
                                                    imageUrl: e.target.value
                                                })}
                                                placeholder={`Option ${index + 1} image URL`}
                                            />
                                            {option.imageUrl && (
                                                <div className="mt-2">
                                                    <img
                                                        src={option.imageUrl}
                                                        alt={`Preview ${index + 1}`}
                                                        className="img-fluid rounded"
                                                    // style={{ maxHeight: '100px', objectFit: 'contain' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className={`text-center ${selectedAnswer === index ? 'ms-2' : ''}`}>
                                            {renderOptionContent(option, index)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isEditMode && (
                            <div className="col-12 mt-2">
                                <button
                                    className="btn btn-outline-primary w-100"
                                    onClick={() => onOptionTextChange(question._id, question.options.length, { text: '', imageUrl: '' })}
                                >
                                    <i className="bi bi-plus"></i> Add Option
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default QuestionCard;