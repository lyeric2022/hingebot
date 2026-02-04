"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Check, SlidersHorizontal, CheckCircle2, X, Download, Loader2, Save } from "lucide-react";
import ProfileModal from "./ProfileModal";
import type { Subject, LikeLimit } from "@/app/page";

interface GridViewProps {
  subjects: Subject[];
  onLike: (subject: Subject, comment?: string) => Promise<boolean>;
  loading: boolean;
  likeLimit: LikeLimit | null;
  onLoadMore?: (targetCount: number, onProgress: (current: number, added: number) => void) => Promise<void>;
  apiUrl: string;
}

interface Filters {
  minAge: number;
  maxAge: number;
  location: string;
  verified: boolean;
  hasJob: boolean;
  hasSchool: boolean;
  minHeight: string;
  maxHeight: string;
  drinking: string;
  smoking: string;
  religion: string;
  children: string;
  familyPlans: string;
}

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

// Convert cm to feet/inches for display
const formatHeight = (height: any): string | null => {
  if (!height) return null;
  if (typeof height === "string" && height.includes("'")) return height;
  const cm = typeof height === "number" ? height : parseInt(height);
  if (isNaN(cm) || cm < 100 || cm > 250) return null;
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

// Get label for numeric code
const getLabel = (value: any, map: Record<number, string>): string => {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : parseInt(value);
  if (!isNaN(num) && map[num]) return map[num];
  return typeof value === "string" ? value : String(value);
};

const defaultFilters: Filters = {
  minAge: 18,
  maxAge: 99,
  location: "",
  verified: false,
  hasJob: false,
  hasSchool: false,
  minHeight: "",
  maxHeight: "",
  drinking: "",
  smoking: "",
  religion: "",
  children: "",
  familyPlans: "",
};

// Height in inches for comparison
const heightToInches = (height: any): number => {
  if (!height || typeof height !== "string") return 0;
  const match = height.match(/(\d+)'(\d+)"/);
  if (match) {
    return parseInt(match[1]) * 12 + parseInt(match[2]);
  }
  // Try cm
  const cmMatch = height.match(/(\d+)\s*cm/i);
  if (cmMatch) {
    return Math.round(parseInt(cmMatch[1]) / 2.54);
  }
  return 0;
};

export default function GridView({ subjects, onLike, loading, likeLimit, onLoadMore, apiUrl }: GridViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkLiking, setBulkLiking] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Subject | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ current: 0, lastAdded: 0 });
  const [targetCount, setTargetCount] = useState(100);
  const [autoDownload, setAutoDownload] = useState(true); // Default ON
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [savedCount, setSavedCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const getProfile = (subject: Subject) => {
    return subject.profile?.profile || subject.profile || {};
  };

  // Fetch saved count on mount
  useEffect(() => {
    fetchSavedCount();
  }, []);

  const fetchSavedCount = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/saved-profiles`);
      const data = await res.json();
      if (data.success) {
        setSavedCount(data.count);
        // Track already-saved IDs to avoid re-saving
        const ids = new Set<string>(data.profiles.map((p: any) => p.subjectId));
        setDownloadedIds(ids);
      }
    } catch (err) {
      console.error("Failed to fetch saved count:", err);
    }
  };

  // Auto-save new profiles when they're loaded
  useEffect(() => {
    if (!autoDownload || subjects.length === 0) return;
    
    // Find new profiles that haven't been saved yet
    const newProfiles = subjects.filter(s => !downloadedIds.has(s.subjectId));
    
    if (newProfiles.length > 0) {
      saveProfilesToServer(newProfiles);
    }
  }, [subjects, autoDownload, downloadedIds]);

  const saveProfilesToServer = async (profilesToSave: Subject[]) => {
    const exportData = profilesToSave.map((subject) => {
      const profile = getProfile(subject);
      return {
        subjectId: subject.subjectId,
        ratingToken: subject.ratingToken,
        firstName: profile.firstName || "",
        age: profile.age || "",
        location: profile.location?.name || profile.hometown || "",
        jobTitle: profile.jobTitle || "",
        company: profile.company || "",
        school: profile.school || "",
        height: formatHeight(profile.height) || "",
        heightRaw: profile.height,
        drinking: getLabel(profile.drinking, DRINKING_MAP),
        drinkingRaw: profile.drinking,
        smoking: getLabel(profile.smoking, SMOKING_MAP),
        smokingRaw: profile.smoking,
        religion: profile.religion || "",
        children: getLabel(profile.children, CHILDREN_MAP),
        childrenRaw: profile.children,
        familyPlans: getLabel(profile.familyPlans, FAMILY_PLANS_MAP),
        familyPlansRaw: profile.familyPlans,
        verified: profile.selfieVerified || false,
        photos: (profile.photos || []).map((p: any) => p.url),
        prompts: (profile.answers || []).map((a: any) => ({
          question: a.question || "",
          answer: a.response || "",
        })),
        savedAt: new Date().toISOString(),
      };
    });

    try {
      const res = await fetch(`${apiUrl}/api/save-profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      });
      const data = await res.json();
      
      if (data.success) {
        setSavedCount(data.total);
        setSaveStatus(`+${data.saved} saved`);
        setTimeout(() => setSaveStatus(""), 2000);
        
        // Update tracked IDs
        const newIds = new Set(downloadedIds);
        profilesToSave.forEach(p => newIds.add(p.subjectId));
        setDownloadedIds(newIds);
      }
    } catch (err) {
      console.error("Failed to save profiles:", err);
      setSaveStatus("Save failed");
      setTimeout(() => setSaveStatus(""), 2000);
    }
  };

  const clearSavedProfiles = async () => {
    if (!confirm("Clear all saved profiles?")) return;
    
    try {
      await fetch(`${apiUrl}/api/saved-profiles`, { method: "DELETE" });
      setSavedCount(0);
      setDownloadedIds(new Set());
    } catch (err) {
      console.error("Failed to clear profiles:", err);
    }
  };

  // Get unique values for dropdown filters with proper labels
  const getUniqueOptions = (key: string, labelMap?: Record<number, string>): { value: string; label: string }[] => {
    const seen = new Map<string, string>();
    subjects.forEach((subject) => {
      const profile = getProfile(subject);
      const value = profile[key];
      if (value !== null && value !== undefined) {
        const strValue = String(value);
        if (!seen.has(strValue)) {
          const label = labelMap ? getLabel(value, labelMap) : strValue;
          seen.set(strValue, label);
        }
      }
    });
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const drinkingOptions = getUniqueOptions("drinking", DRINKING_MAP);
  const smokingOptions = getUniqueOptions("smoking", SMOKING_MAP);
  const religionOptions = getUniqueOptions("religion");
  const childrenOptions = getUniqueOptions("children", CHILDREN_MAP);
  const familyPlansOptions = getUniqueOptions("familyPlans", FAMILY_PLANS_MAP);

  const filteredSubjects = subjects.filter((subject) => {
    const profile = getProfile(subject);
    const age = profile.age || 0;
    const location = profile.location?.name || profile.hometown || "";
    const verified = profile.selfieVerified || false;
    const hasJob = !!profile.jobTitle;
    const hasSchool = !!profile.school;
    const heightInches = heightToInches(profile.height || "");

    // Basic filters
    if (age < filters.minAge || age > filters.maxAge) return false;
    if (filters.location && !location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.verified && !verified) return false;
    if (filters.hasJob && !hasJob) return false;
    if (filters.hasSchool && !hasSchool) return false;

    // Height filters
    if (filters.minHeight) {
      const minInches = heightToInches(filters.minHeight);
      if (heightInches > 0 && heightInches < minInches) return false;
    }
    if (filters.maxHeight) {
      const maxInches = heightToInches(filters.maxHeight);
      if (heightInches > 0 && heightInches > maxInches) return false;
    }

    // Lifestyle filters (compare as strings since filter values are strings)
    if (filters.drinking && String(profile.drinking) !== filters.drinking) return false;
    if (filters.smoking && String(profile.smoking) !== filters.smoking) return false;
    if (filters.religion && String(profile.religion) !== filters.religion) return false;
    if (filters.children && String(profile.children) !== filters.children) return false;
    if (filters.familyPlans && String(profile.familyPlans) !== filters.familyPlans) return false;

    return true;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "minAge" && value === 18) return false;
    if (key === "maxAge" && value === 99) return false;
    if (value === "" || value === false) return false;
    return true;
  }).length;

  const toggleSelect = (e: React.MouseEvent, subjectId: string) => {
    e.stopPropagation();
    const newSelected = new Set(selected);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === filteredSubjects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredSubjects.map((s) => s.subjectId)));
    }
  };

  const bulkLike = async () => {
    if (selected.size === 0) return;
    
    setBulkLiking(true);
    const toProcess = filteredSubjects.filter((s) => selected.has(s.subjectId));
    
    for (const subject of toProcess) {
      await onLike(subject);
      await new Promise((r) => setTimeout(r, 2000));
    }
    
    setSelected(new Set());
    setBulkLiking(false);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const handleLoadMore = async () => {
    if (!onLoadMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setLoadProgress({ current: subjects.length, lastAdded: 0 });
    
    await onLoadMore(targetCount, (current, added) => {
      setLoadProgress({ current, lastAdded: added });
    });
    
    setIsLoadingMore(false);
  };

  const downloadProfiles = (format: "json" | "csv") => {
    const profilesToExport = filteredSubjects.map((subject) => {
      const profile = getProfile(subject);
      return {
        subjectId: subject.subjectId,
        ratingToken: subject.ratingToken,
        firstName: profile.firstName || "",
        age: profile.age || "",
        location: profile.location?.name || profile.hometown || "",
        jobTitle: profile.jobTitle || "",
        company: profile.company || "",
        school: profile.school || "",
        height: formatHeight(profile.height) || "",
        drinking: getLabel(profile.drinking, DRINKING_MAP),
        smoking: getLabel(profile.smoking, SMOKING_MAP),
        religion: profile.religion || "",
        children: getLabel(profile.children, CHILDREN_MAP),
        familyPlans: getLabel(profile.familyPlans, FAMILY_PLANS_MAP),
        verified: profile.selfieVerified ? "Yes" : "No",
        photos: (profile.photos || []).map((p: any) => p.url),
        prompts: (profile.answers || []).map((a: any) => ({
          question: a.question || "",
          answer: a.response || "",
        })),
      };
    });

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(profilesToExport, null, 2);
      filename = `hinge_profiles_${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
    } else {
      // CSV format
      const headers = [
        "subjectId", "ratingToken", "firstName", "age", "location", 
        "jobTitle", "company", "school", "height", "drinking", "smoking",
        "religion", "children", "familyPlans", "verified", "photoCount", "photo1"
      ];
      const rows = profilesToExport.map(p => [
        p.subjectId,
        p.ratingToken,
        p.firstName,
        p.age,
        `"${p.location}"`,
        `"${p.jobTitle}"`,
        `"${p.company}"`,
        `"${p.school}"`,
        p.height,
        p.drinking,
        p.smoking,
        p.religion,
        p.children,
        p.familyPlans,
        p.verified,
        p.photos.length,
        p.photos[0] || "",
      ]);
      content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      filename = `hinge_profiles_${new Date().toISOString().split("T")[0]}.csv`;
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilters 
                ? "bg-gray-900 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-pink-500 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {selected.size === filteredSubjects.length && filteredSubjects.length > 0 ? "Deselect" : "Select All"}
          </button>

          <span className="text-gray-400 text-sm">
            {selected.size} of {filteredSubjects.length} selected
          </span>

          {/* Download buttons */}
          <div className="hidden sm:flex items-center gap-1 ml-2">
            <button
              onClick={() => downloadProfiles("json")}
              disabled={filteredSubjects.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              title="Download as JSON"
            >
              <Save className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => downloadProfiles("csv")}
              disabled={filteredSubjects.length === 0}
              className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              title="Download as CSV"
            >
              <Save className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        <button
          onClick={bulkLike}
          disabled={selected.size === 0 || bulkLiking || (likeLimit?.likesLeft === 0)}
          className="flex items-center gap-2 px-5 py-2.5 gradient-btn text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {bulkLiking ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Liking...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              Like Selected
            </>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
          {/* Row 1: Basic Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Min Age</label>
              <input
                type="number"
                value={filters.minAge}
                onChange={(e) => setFilters({ ...filters, minAge: parseInt(e.target.value) || 18 })}
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Max Age</label>
              <input
                type="number"
                value={filters.maxAge}
                onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) || 99 })}
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="e.g. LA"
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Min Height</label>
              <input
                type="text"
                value={filters.minHeight}
                onChange={(e) => setFilters({ ...filters, minHeight: e.target.value })}
                placeholder={`e.g. 5'6"`}
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Max Height</label>
              <input
                type="text"
                value={filters.maxHeight}
                onChange={(e) => setFilters({ ...filters, maxHeight: e.target.value })}
                placeholder={`e.g. 6'2"`}
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Row 2: Dropdown Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {drinkingOptions.length > 0 && (
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Drinking</label>
                <select
                  value={filters.drinking}
                  onChange={(e) => setFilters({ ...filters, drinking: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                >
                  <option value="">Any</option>
                  {drinkingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {smokingOptions.length > 0 && (
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Smoking</label>
                <select
                  value={filters.smoking}
                  onChange={(e) => setFilters({ ...filters, smoking: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                >
                  <option value="">Any</option>
                  {smokingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {religionOptions.length > 0 && (
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Religion</label>
                <select
                  value={filters.religion}
                  onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                >
                  <option value="">Any</option>
                  {religionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {childrenOptions.length > 0 && (
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Children</label>
                <select
                  value={filters.children}
                  onChange={(e) => setFilters({ ...filters, children: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                >
                  <option value="">Any</option>
                  {childrenOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {familyPlansOptions.length > 0 && (
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Family Plans</label>
                <select
                  value={filters.familyPlans}
                  onChange={(e) => setFilters({ ...filters, familyPlans: e.target.value })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                >
                  <option value="">Any</option>
                  {familyPlansOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 3: Checkboxes */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-gray-700 text-sm">Verified Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasJob}
                onChange={(e) => setFilters({ ...filters, hasJob: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-gray-700 text-sm">Has Job Listed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasSchool}
                onChange={(e) => setFilters({ ...filters, hasSchool: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-gray-700 text-sm">Has School Listed</span>
            </label>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredSubjects.map((subject) => {
          const profile = getProfile(subject);
          const photos = profile.photos || [];
          const isSelected = selected.has(subject.subjectId);

          return (
            <div
              key={subject.subjectId}
              onClick={() => setSelectedProfile(subject)}
              className={`group relative cursor-pointer rounded-2xl overflow-hidden bg-white shadow-sm card-hover ${
                isSelected ? "ring-2 ring-pink-500 ring-offset-2" : "border border-gray-200"
              }`}
            >
              {/* Photo */}
              <div className="aspect-[3/4] bg-gray-100">
                {photos[0]?.url ? (
                  <img
                    src={photos[0].url}
                    alt={profile.firstName || "Profile"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>

              {/* Selection checkbox */}
              <button
                onClick={(e) => toggleSelect(e, subject.subjectId)}
                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isSelected 
                    ? "bg-pink-500 scale-100" 
                    : "bg-white/80 scale-90 opacity-0 group-hover:opacity-100 shadow-sm hover:bg-white"
                }`}
              >
                <Check className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
              </button>

              {/* Verified badge */}
              {profile.selfieVerified && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500 rounded-full text-[10px] font-medium text-white uppercase tracking-wider">
                  Verified
                </div>
              )}

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-12">
                <p className="text-white font-semibold">
                  {profile.firstName || "Unknown"}, {profile.age || "?"}
                </p>
                <p className="text-white/70 text-sm truncate">
                  {profile.location?.name || profile.hometown || ""}
                </p>
                {profile.height && (
                  <p className="text-white/60 text-xs mt-0.5">
                    {formatHeight(profile.height) || profile.height}
                  </p>
                )}
              </div>

              {/* Click hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full transition-opacity">
                  View Profile
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && !isLoadingMore && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500">No profiles match your filters</p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 text-pink-600 hover:text-pink-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Load More Section */}
      {onLoadMore && (
        <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-gray-900">Load More Profiles</h3>
              <p className="text-sm text-gray-500 mt-1">
                Currently have <span className="font-semibold text-pink-600">{subjects.length}</span> profiles
                {activeFilterCount > 0 && (
                  <span> ({filteredSubjects.length} matching filters)</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Load until:</label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(subjects.length + 1, parseInt(e.target.value) || 100))}
                  min={subjects.length + 1}
                  max={500}
                  className="w-20 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 text-center"
                  disabled={isLoadingMore}
                />
              </div>
              
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore || subjects.length >= targetCount}
                className="flex items-center gap-2 px-5 py-2.5 gradient-btn text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading... ({loadProgress.current})
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Load More
                  </>
                )}
              </button>
            </div>
          </div>
          
          {isLoadingMore && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Progress</span>
                <span>{loadProgress.current} / {targetCount} profiles</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (loadProgress.current / targetCount) * 100)}%` }}
                />
              </div>
              {loadProgress.lastAdded === 0 && loadProgress.current > 0 && (
                <p className="text-amber-600 text-sm mt-2">
                  ⚠️ No new profiles found - you may have seen all available profiles
                </p>
              )}
              {loadProgress.lastAdded === -1 && (
                <p className="text-red-600 text-sm mt-2">
                  ❌ Rate limited by Hinge - too many requests. Try again in a few minutes.
                </p>
              )}
            </div>
          )}

          {/* Auto-Save Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDownload}
                    onChange={(e) => setAutoDownload(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 font-medium">Auto-save new profiles</span>
                </label>
                
                {autoDownload && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    ✓ Active
                  </span>
                )}
                
                {saveStatus && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                    {saveStatus}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">
                  Saved: <span className="font-semibold text-gray-900">{savedCount}</span> profiles
                </span>
                
                <button
                  onClick={clearSavedProfiles}
                  disabled={savedCount === 0}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Clear
                </button>
              </div>
            </div>

            {autoDownload && (
              <p className="text-xs text-gray-400 mt-2">
                New profiles are automatically saved to <code className="bg-gray-100 px-1 rounded">saved_profiles.json</code> in the repo. View them in the "Saved" tab.
              </p>
            )}
          </div>
        </div>
      )}

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
