"use client";

import { useState } from "react";
import ProfileCard from "./ProfileCard";
import type { Subject } from "@/app/page";

interface SwipeViewProps {
  subjects: Subject[];
  onLike: (subject: Subject, comment?: string) => Promise<boolean>;
  onSkip: (subject: Subject) => void;
  loading: boolean;
}

export default function SwipeView({ subjects, onLike, onSkip, loading }: SwipeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const currentSubject = subjects[currentIndex];

  const handleLike = async (comment?: string, contentId?: string) => {
    if (!currentSubject) return;
    setActionLoading(true);
    await onLike(currentSubject, comment);
    setActionLoading(false);
  };

  const handleSkip = () => {
    if (!currentSubject) return;
    onSkip(currentSubject);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentSubject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re all caught up!</h2>
        <p className="text-gray-500">Check back later for more profiles</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4">
      <ProfileCard
        subject={currentSubject}
        onLike={handleLike}
        onSkip={handleSkip}
        loading={actionLoading}
      />
    </div>
  );
}
