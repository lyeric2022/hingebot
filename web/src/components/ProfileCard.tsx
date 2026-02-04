"use client";

import { useState } from "react";
import { Heart, X, ChevronLeft, ChevronRight, MessageCircle, MapPin, Briefcase } from "lucide-react";

interface Subject {
  subjectId: string;
  ratingToken: string;
  profile?: any;
}

interface ProfileCardProps {
  subject: Subject;
  onLike: (comment?: string, contentId?: string, questionId?: string) => void;
  onSkip: () => void;
  loading: boolean;
}

export default function ProfileCard({ subject, onLike, onSkip, loading }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState<{
    questionId: string;
    question: string;
    contentId: string;
  } | null>(null);

  const profileData = subject.profile?.profile || subject.profile;
  const photos = profileData?.photos || [];
  const prompts = profileData?.answers || [];

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleLikeClick = () => {
    if (selectedPrompt) {
      onLike(comment, undefined, selectedPrompt.questionId);
    } else if (photos.length > 0) {
      const photoId = photos[currentPhotoIndex]?.contentId;
      onLike(comment, photoId, undefined);
    } else {
      onLike(comment);
    }
    setComment("");
    setShowCommentInput(false);
    setSelectedPrompt(null);
  };

  const selectPromptToLike = (prompt: any) => {
    setSelectedPrompt({
      questionId: prompt.questionId,
      question: prompt.response,
      contentId: prompt.contentId
    });
    setShowCommentInput(true);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Photo Section */}
      <div className="relative bg-gray-100 rounded-t-3xl overflow-hidden aspect-[3/4] shadow-lg">
        {photos.length > 0 ? (
          <>
            <img
              src={photos[currentPhotoIndex]?.url}
              alt={profileData?.firstName || "Profile"}
              className="w-full h-full object-cover"
            />

            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                {/* Photo indicators */}
                <div className="absolute top-4 left-4 right-4 flex gap-1">
                  {photos.map((_: any, index: number) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        index === currentPhotoIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm"
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm"
                  disabled={currentPhotoIndex === photos.length - 1}
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-6xl">👤</span>
          </div>
        )}

        {/* Basic Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-bold text-white">
            {profileData?.firstName || "Unknown"}, {profileData?.age || "?"}
          </h2>
          {(profileData?.location?.name || profileData?.hometown) && (
            <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {profileData?.location?.name || profileData?.hometown}
            </p>
          )}
          {profileData?.jobTitle && (
            <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
              <Briefcase className="w-3.5 h-3.5" />
              {profileData.jobTitle}
            </p>
          )}
        </div>
      </div>

      {/* Prompts Section */}
      {prompts.length > 0 && (
        <div className="bg-white px-4 py-4 space-y-2 max-h-40 overflow-y-auto border-x border-gray-200">
          {prompts.slice(0, 3).map((prompt: any, index: number) => (
            <button
              key={index}
              onClick={() => selectPromptToLike(prompt)}
              className={`w-full text-left p-3 rounded-xl transition-colors ${
                selectedPrompt?.questionId === prompt.questionId
                  ? "bg-pink-50 border border-pink-200"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Prompt
              </p>
              <p className="text-gray-900 text-sm">{prompt.response}</p>
            </button>
          ))}
        </div>
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className="bg-white px-4 py-3 border-x border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={selectedPrompt ? "Add a comment..." : "Say something..."}
              className="flex-1 bg-gray-100 text-gray-900 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 placeholder:text-gray-400"
              autoFocus
            />
            <button
              onClick={() => {
                setShowCommentInput(false);
                setSelectedPrompt(null);
                setComment("");
              }}
              className="text-gray-400 hover:text-gray-600 text-sm px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-b-3xl px-6 py-6 flex items-center justify-center gap-6 border-x border-b border-gray-200 shadow-lg">
        <button
          onClick={onSkip}
          disabled={loading}
          className="p-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-7 h-7 text-gray-500" />
        </button>

        {!showCommentInput && (
          <button
            onClick={() => setShowCommentInput(true)}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-gray-500" />
          </button>
        )}

        <button
          onClick={handleLikeClick}
          disabled={loading}
          className="p-4 gradient-btn rounded-full disabled:opacity-50"
        >
          {loading ? (
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Heart className="w-7 h-7 text-white fill-white" />
          )}
        </button>
      </div>
    </div>
  );
}
