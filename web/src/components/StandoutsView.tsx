"use client";

import { useState } from "react";
import { Star, Sparkles, Send } from "lucide-react";
import ProfileModal from "./ProfileModal";
import type { Subject } from "@/app/page";

interface StandoutsViewProps {
  standouts: Subject[];
  onLike: (subject: Subject, comment?: string) => Promise<boolean>;
  loading: boolean;
}

export default function StandoutsView({ standouts, onLike, loading }: StandoutsViewProps) {
  const [selectedProfile, setSelectedProfile] = useState<Subject | null>(null);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (standouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Star className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No standouts available</h2>
        <p className="text-gray-500 text-center max-w-sm">
          Check back later for featured profiles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-gray-900 font-medium">Standouts</h2>
            <p className="text-gray-500 text-sm">
              Featured profiles highlighted by Hinge. Requires a Rose to like.
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
        <p>
          <strong className="text-gray-700">Note:</strong> Standouts are popular profiles Hinge promotes — 
          they&apos;re <em>not</em> people who liked you. You need a <span className="text-pink-600 font-medium">Rose</span> (superlike) to send them a like.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {standouts.map((subject) => {
          const photoUrl = subject.content?.photo?.url;
          const profile = subject.profile?.profile || subject.profile || {};

          return (
            <div
              key={subject.subjectId}
              onClick={() => setSelectedProfile(subject)}
              className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm card-hover cursor-pointer"
            >
              {/* Photo */}
              <div className="aspect-[3/4] bg-gray-100">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-12 h-12 text-gray-200" />
                  </div>
                )}
              </div>

              {/* Standout badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-purple-500 rounded-full text-xs font-medium text-white flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                Standout
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-16">
                {profile.firstName ? (
                  <>
                    <p className="text-white font-semibold">
                      {profile.firstName}, {profile.age || "?"}
                    </p>
                    <p className="text-white/70 text-sm">
                      {profile.location?.name || ""}
                    </p>
                  </>
                ) : (
                  <p className="text-white/70 text-sm">Featured profile</p>
                )}
              </div>

              {/* View Profile hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full transition-opacity">
                  View Profile
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          subject={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={onLike}
        />
      )}
    </div>
  );
}
