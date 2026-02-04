"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MapPin, Briefcase, GraduationCap, Ruler, Wine, Cigarette, Church, Users, Baby, MessageCircle } from "lucide-react";
import type { Subject } from "@/app/page";

// Hinge uses numeric codes for lifestyle fields
const DRINKING_MAP: Record<number, string> = {
  0: "Not for me",
  1: "Sober",
  2: "On special occasions",
  3: "Socially on weekends",
  4: "Most nights",
  5: "Sober curious",
};

const SMOKING_MAP: Record<number, string> = {
  0: "Non-smoker",
  1: "Smoker when drinking",
  2: "Smoker",
  3: "Trying to quit",
  4: "Social smoker",
};

const CHILDREN_MAP: Record<number, string> = {
  0: "Don't have children",
  1: "Have children",
  2: "Have & want more",
};

const FAMILY_PLANS_MAP: Record<number, string> = {
  0: "Don't want children",
  1: "Want children",
  2: "Open to children",
  3: "Not sure yet",
  4: "Want someday",
  5: "Undecided",
};

// Convert cm to feet/inches
const formatHeight = (height: any): string | null => {
  if (!height) return null;
  
  // If it's already a formatted string like 5'6"
  if (typeof height === "string" && height.includes("'")) {
    return height;
  }
  
  // If it's a number (cm)
  const cm = typeof height === "number" ? height : parseInt(height);
  if (isNaN(cm) || cm < 100 || cm > 250) return null;
  
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}" (${cm} cm)`;
};

// Format any field that might be a numeric code
const formatField = (value: any, map?: Record<number, string>): string | null => {
  if (value === null || value === undefined) return null;
  
  // If it's a string that's not just a number, return as-is
  if (typeof value === "string" && isNaN(Number(value))) {
    return value;
  }
  
  // If we have a map, try to look it up
  if (map) {
    const num = typeof value === "number" ? value : parseInt(value);
    if (!isNaN(num) && map[num]) {
      return map[num];
    }
  }
  
  // Return the value as string if we can't map it
  return typeof value === "string" ? value : String(value);
};

interface ProfileModalProps {
  subject: Subject;
  onClose: () => void;
  onLike: (subject: Subject, comment?: string) => Promise<boolean>;
}

export default function ProfileModal({ subject, onClose, onLike }: ProfileModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [comment, setComment] = useState("");
  const [liking, setLiking] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  const profileData = subject.profile?.profile || subject.profile || {};
  const photos = profileData.photos || [];
  const prompts = profileData.answers || [];

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

  const handleLike = async () => {
    setLiking(true);
    await onLike(subject, comment || undefined);
    setLiking(false);
    onClose();
  };

  // Helper to render detail items
  const DetailItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 py-2">
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-gray-700">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Photo Section */}
        <div className="relative w-full md:w-1/2 aspect-[3/4] md:aspect-auto md:h-auto bg-gray-100 shrink-0">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]?.url}
                alt={profileData.firstName || "Profile"}
                className="w-full h-full object-cover"
              />
              
              {/* Photo indicators */}
              {photos.length > 1 && (
                <>
                  <div className="absolute top-4 left-4 right-16 flex gap-1">
                    {photos.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          index === currentPhotoIndex ? "bg-white" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Navigation */}
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors disabled:opacity-30"
                    disabled={currentPhotoIndex === 0}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-colors disabled:opacity-30"
                    disabled={currentPhotoIndex === photos.length - 1}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Verified badge */}
              {profileData.selfieVerified && (
                <div className="absolute top-4 left-4 mt-6 px-2.5 py-1 bg-blue-500 rounded-full text-xs font-medium text-white">
                  ✓ Verified
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center">
              <span className="text-6xl text-gray-300">👤</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {profileData.firstName || "Unknown"}, {profileData.age || "?"}
            </h2>
            {profileData.location?.name && (
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {profileData.location.name}
              </p>
            )}
          </div>

          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-x-4 border-b border-gray-100 pb-4 mb-4">
            <DetailItem icon={Briefcase} label="Job" value={profileData.jobTitle} />
            <DetailItem icon={GraduationCap} label="School" value={profileData.school} />
            <DetailItem icon={Ruler} label="Height" value={formatHeight(profileData.height)} />
            <DetailItem icon={MapPin} label="Hometown" value={profileData.hometown} />
          </div>

          {/* Lifestyle Details */}
          <div className="grid grid-cols-2 gap-x-4 border-b border-gray-100 pb-4 mb-4">
            <DetailItem icon={Wine} label="Drinking" value={formatField(profileData.drinking, DRINKING_MAP)} />
            <DetailItem icon={Cigarette} label="Smoking" value={formatField(profileData.smoking, SMOKING_MAP)} />
            <DetailItem icon={Church} label="Religion" value={formatField(profileData.religion)} />
            <DetailItem icon={Users} label="Ethnicity" value={formatField(profileData.ethnicity)} />
            <DetailItem icon={Baby} label="Children" value={formatField(profileData.children, CHILDREN_MAP)} />
            <DetailItem icon={Baby} label="Family Plans" value={formatField(profileData.familyPlans, FAMILY_PLANS_MAP)} />
          </div>

          {/* Prompts */}
          {prompts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Prompts</h3>
              <div className="space-y-3">
                {prompts.map((prompt: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPrompt(selectedPrompt?.questionId === prompt.questionId ? null : prompt)}
                    className={`w-full text-left p-4 rounded-xl transition-colors ${
                      selectedPrompt?.questionId === prompt.questionId
                        ? "bg-pink-50 border-2 border-pink-200"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    {prompt.question && (
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        {prompt.question}
                      </p>
                    )}
                    <p className="text-gray-900">{prompt.response}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comment Input */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {selectedPrompt ? "Reply to this prompt" : "Add a comment with your like"}
              </span>
            </div>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={selectedPrompt ? `Reply to: "${selectedPrompt.response?.slice(0, 30)}..."` : "Say something nice..."}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={liking}
            className="w-full py-4 gradient-btn text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {liking ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white" />
                Like {profileData.firstName || "Profile"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
