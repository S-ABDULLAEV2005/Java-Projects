"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    LoaderCircle,
    MessageSquare,
    Send,
    Star,
} from "lucide-react";

type Feedback = {
    id: number;
    rating: number;
    comment: string;
    productId: number;
    productName: string;
};

type ProductFeedbackProps = {
    productId: number;
};

export default function ProductFeedback({
                                            productId,
                                        }: ProductFeedbackProps) {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [success, setSuccess] = useState("");

    const loadFeedbacks = useCallback(async (signal?: AbortSignal) => {
        try {
            const response = await fetch(
                `/api/products/${productId}/feedbacks`,
                {
                    cache: "no-store",
                    signal,
                },
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ?? "Could not load feedback.",
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("The feedback response could not be read.");
            }

            if (!signal?.aborted) {
                setFeedbacks(data);
                setLoadError("");
            }
        } catch (exception) {
            if (!signal?.aborted) {
                setLoadError(
                    exception instanceof Error
                        ? exception.message
                        : "Could not load feedback.",
                );
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [productId]);

    useEffect(() => {
        const controller = new AbortController();

        // This effect subscribes to external API data; state updates occur after the request.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadFeedbacks(controller.signal);

        return () => controller.abort();
    }, [loadFeedbacks]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (rating < 1 || rating > 5) {
            setError("Please select a rating from 1 to 5 stars.");
            return;
        }

        if (!comment.trim()) {
            setError("Please write your feedback.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(
                `/api/feedbacks/product/${productId}`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        rating: rating,
                        comment: comment.trim(),
                    }),
                },
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Your session has expired. Please log in again.",
                    );
                }

                throw new Error(
                    data?.message ??
                    `Could not submit feedback: ${response.status}`,
                );
            }

            const createdFeedback: Feedback = data;

            setFeedbacks((currentFeedbacks) => [
                createdFeedback,
                ...currentFeedbacks,
            ]);

            setRating(0);
            setHoveredRating(0);
            setComment("");

            setSuccess("Your feedback was added successfully.");
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : "Could not submit feedback.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="product-feedback-section">
            <div className="feedback-section-heading">
                <div className="feedback-heading-icon">
                    <MessageSquare size={23} />
                </div>

                <div>
                    <p className="feedback-eyebrow">Customer experience</p>
                    <h2>Customer feedback</h2>
                    <p>
                        {loading
                            ? "Loading customer reviews…"
                            : loadError
                                ? "Customer reviews are temporarily unavailable."
                                : feedbacks.length === 0
                                    ? "Be the first customer to review this product."
                                    : `${feedbacks.length} ${
                                        feedbacks.length === 1 ? "review" : "reviews"
                                    } loaded`}
                    </p>
                </div>
            </div>

            <div className="feedback-layout">
                <form
                    className="feedback-form"
                    onSubmit={handleSubmit}
                >
                    <div className="feedback-form-heading">
                        <div>
                            <span>Share your experience</span>
                            <h3>Write a review</h3>
                        </div>

                        <MessageSquare size={21} />
                    </div>

                    <fieldset className="feedback-rating-field">
                        <legend>Your rating</legend>

                        <div
                            className="feedback-stars"
                            aria-label="Choose a rating"
                        >
                            {[1, 2, 3, 4, 5].map((star) => {
                                const active =
                                    star <=
                                    (hoveredRating || rating);

                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        className={
                                            active
                                                ? "feedback-star active"
                                                : "feedback-star"
                                        }
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() =>
                                            setHoveredRating(star)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredRating(0)
                                        }
                                        aria-pressed={rating === star}
                                        aria-label={`${star} ${
                                            star === 1
                                                ? "star"
                                                : "stars"
                                        }`}
                                    >
                                        <Star
                                            size={25}
                                            fill={
                                                active
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />
                                    </button>
                                );
                            })}

                            {rating > 0 && (
                                <span className="selected-rating">
                                    {rating}/5
                                </span>
                            )}
                        </div>
                    </fieldset>

                    <label className="feedback-comment-field">
                        <span>Your feedback</span>

                        <textarea
                            value={comment}
                            onChange={(event) =>
                                setComment(event.target.value)
                            }
                            placeholder="What did you like about this product?"
                            maxLength={1000}
                            rows={5}
                            disabled={submitting}
                        />

                        <small>{comment.length}/1000</small>
                    </label>

                    {error && (
                        <div
                            className="feedback-message feedback-error"
                            role="alert"
                        >
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div
                            className="feedback-message feedback-success"
                            role="status"
                        >
                            <CheckCircle2 size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="feedback-submit-button"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <LoaderCircle
                                    className="feedback-spinner"
                                    size={18}
                                />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                Submit feedback
                            </>
                        )}
                    </button>
                </form>

                <div className="feedback-list">
                    {loading ? (
                        <div className="feedback-status-card">
                            <LoaderCircle
                                className="feedback-spinner"
                                size={28}
                            />
                            <h3>Loading feedback</h3>
                        </div>
                    ) : loadError ? (
                        <div className="feedback-status-card" role="alert">
                            <AlertCircle size={30} />
                            <h3>Couldn’t load feedback</h3>
                            <p>{loadError}</p>

                            <button
                                type="button"
                                className="feedback-retry-button"
                                onClick={() => { setLoading(true); void loadFeedbacks(); }}
                            >
                                Try again
                            </button>
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="feedback-status-card">
                            <MessageSquare size={34} />
                            <h3>No feedback yet</h3>
                            <p>
                                Customers have not reviewed this product
                                yet.
                            </p>
                        </div>
                    ) : (
                        feedbacks.map((feedback) => (
                            <article
                                key={feedback.id}
                                className="feedback-card"
                            >
                                <div className="feedback-card-top">
                                    <div className="feedback-card-stars">
                                        {[1, 2, 3, 4, 5].map(
                                            (star) => (
                                                <Star
                                                    key={star}
                                                    size={16}
                                                    fill={
                                                        star <=
                                                        feedback.rating
                                                            ? "currentColor"
                                                            : "none"
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>

                                    <strong>
                                        {feedback.rating}/5
                                    </strong>
                                </div>

                                <p>{feedback.comment}</p>

                                <span>WildMarket customer</span>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}