"use client";

import { useState, useEffect } from "react";
import { Trash2, Download, RefreshCw, Search, ChevronLeft, ChevronRight, X, Heart, MapPin, Briefcase, GraduationCap } from "lucide-react";

interface SavedProfile {
  subjectId: string;
  ratingToken: string;
  firstName: string;
  age: number | string;
  location: string;
  jobTitle: string;
  company: string;
  school: string;
  height: string;
  drinking: string;
  smoking: string;
  religion: string;
  children: string;
  familyPlans: string;
  verified: boolean;
  photos: string[];
  prompts: { question: string; answer: string }[];
  savedAt: string;
}

interface SavedProfilesProps {
  apiUrl: string;
  onLike?: (subjectId: string, ratingToken: string) => Promise<boolean>;
}

export default function SavedProfiles({ apiUrl, onLike }: SavedProfilesProps) {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<SavedProfile | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/saved-profiles`);
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error("Failed to fetch saved profiles:", err);
    }
    setLoading(false);
  };

  const clearAll = async () => {
    if (!confirm("Delete all saved profiles? This cannot be undone.")) return;
    
    try {
      await fetch(`${apiUrl}/api/saved-profiles`, { method: "DELETE" });
      setProfiles([]);
    } catch (err) {
      console.error("Failed to clear profiles:", err);
    }
  };

  const downloadAll = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hinge_saved_profiles_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.firstName?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.jobTitle?.toLowerCase().includes(term) ||
      p.school?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="font-semibold text-gray-900">Saved Profiles</h2>
          <p className="text-sm text-gray-500 mt-1">
            {profiles.length} profiles saved to <code className="bg-gray-100 px-1 rounded text-xs">saved_profiles.json</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-pink-300 w-48"
            />
          </div>

          <button
            onClick={fetchProfiles}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>

          <button
            onClick={downloadAll}
            disabled={profiles.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={clearAll}
            disabled={profiles.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.subjectId}
              onClick={() => {
                setSelectedProfile(profile);
                setCurrentPhotoIndex(0);
              }}
              className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Photo */}
              <div className="aspect-[3/4] bg-gray-100">
                {profile.photos?.[0] ? (
                  <img
                    src={profile.photos[0]}
                    alt={profile.firstName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>

              {/* Verified badge */}
              {profile.verified && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500 rounded-full text-[10px] font-medium text-white">
                  Verified
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-12">
                <p className="text-white font-semibold">
                  {profile.firstName}, {profile.age}
                </p>
                <p className="text-white/70 text-sm truncate">
                  {profile.location}
                </p>
              </div>

              {/* Saved date */}
              <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded-full text-[10px] text-white">
                {new Date(profile.savedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-gray-500">
            {searchTerm ? "No profiles match your search" : "No saved profiles yet"}
          </p>
          {!searchTerm && (
            <p className="text-gray-400 text-sm mt-2">
              Enable auto-save in the Grid view to start collecting profiles
            </p>
          )}
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProfile(null)}
          />
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            {/* Close button */}
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Photo Section */}
            <div className="relative w-full md:w-1/2 aspect-[3/4] md:aspect-auto bg-gray-100 shrink-0">
              {selectedProfile.photos?.length > 0 ? (
                <>
                  <img
                    src={selectedProfile.photos[currentPhotoIndex]}
                    alt={selectedProfile.firstName}
                    className="w-full h-full object-cover"
                  />
                  
                  {selectedProfile.photos.length > 1 && (
                    <>
                      <div className="absolute top-4 left-4 right-16 flex gap-1">
                        {selectedProfile.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              index === currentPhotoIndex ? "bg-white" : "bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg disabled:opacity-30"
                        disabled={currentPhotoIndex === 0}
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setCurrentPhotoIndex(Math.min(selectedProfile.photos.length - 1, currentPhotoIndex + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg disabled:opacity-30"
                        disabled={currentPhotoIndex === selectedProfile.photos.length - 1}
                      >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                      </button>
                    </>
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
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedProfile.firstName}, {selectedProfile.age}
                </h2>
                {selectedProfile.location && (
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedProfile.location}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                {selectedProfile.jobTitle && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedProfile.jobTitle}</span>
                  </div>
                )}
                {selectedProfile.school && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedProfile.school}</span>
                  </div>
                )}
                {selectedProfile.height && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">📏</span>
                    <span className="text-gray-700">{selectedProfile.height}</span>
                  </div>
                )}
              </div>

              {/* Lifestyle */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedProfile.drinking && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    🍷 {selectedProfile.drinking}
                  </span>
                )}
                {selectedProfile.smoking && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    🚬 {selectedProfile.smoking}
                  </span>
                )}
                {selectedProfile.religion && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    ⛪ {selectedProfile.religion}
                  </span>
                )}
                {selectedProfile.familyPlans && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    👶 {selectedProfile.familyPlans}
                  </span>
                )}
              </div>

              {/* Prompts */}
              {selectedProfile.prompts?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Prompts</h3>
                  <div className="space-y-3">
                    {selectedProfile.prompts.map((prompt, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4">
                        {prompt.question && (
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                            {prompt.question}
                          </p>
                        )}
                        <p className="text-gray-900">{prompt.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved date */}
              <p className="text-xs text-gray-400">
                Saved on {new Date(selectedProfile.savedAt).toLocaleString()}
              </p>

              {/* Like button if handler provided */}
              {onLike && (
                <button
                  onClick={() => onLike(selectedProfile.subjectId, selectedProfile.ratingToken)}
                  className="mt-4 w-full py-3 gradient-btn text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Like {selectedProfile.firstName}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
