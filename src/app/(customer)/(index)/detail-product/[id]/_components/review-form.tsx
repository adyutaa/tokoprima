"use client";

import { useState } from "react";
import { addReview } from "../lib/data";

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await addReview(productId, rating, comment);
      setRating(5);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    }
  };
  return (
    <form onSubmit={handleSubmit} className="my-4 p-4 border rounded">
      {error && <p className="text-red-600">{error}</p>}
      <div className="mb-2">
        <label className="block font-semibold mb-1">Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border p-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="block font-semibold mb-1">Comment</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="border p-1 w-full" rows={3} />
      </div>
      <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-500">
        Submit Review
      </button>
    </form>
  );
}
