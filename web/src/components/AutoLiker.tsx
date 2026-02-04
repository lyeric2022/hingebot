"use client";

import { useState } from "react";
import { Play, Square, Settings2, Zap, AlertCircle, Terminal } from "lucide-react";
import type { Subject, LikeLimit } from "@/app/page";

interface AutoLikerProps {
  subjects: Subject[];
  onLike: (subject: Subject, comment?: string) => Promise<boolean>;
  likeLimit: LikeLimit | null;
}

interface Config {
  minAge: number;
  maxAge: number;
  location: string;
  verifiedOnly: boolean;
  hasJobOnly: boolean;
  delaySeconds: number;
  maxLikes: number;
  customComment: string;
}

export default function AutoLiker({ subjects, onLike, likeLimit }: AutoLikerProps) {
  const [config, setConfig] = useState<Config>({
    minAge: 18,
    maxAge: 99,
    location: "",
    verifiedOnly: false,
    hasJobOnly: false,
    delaySeconds: 3,
    maxLikes: 10,
    customComment: "",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, liked: 0 });
  const [log, setLog] = useState<string[]>([]);

  const getProfile = (subject: Subject) => subject.profile?.profile || subject.profile || {};

  const getMatchingSubjects = () => {
    return subjects.filter((subject) => {
      const profile = getProfile(subject);
      const age = profile.age || 0;
      const location = profile.location?.name || profile.hometown || "";

      if (age < config.minAge || age > config.maxAge) return false;
      if (config.location && !location.toLowerCase().includes(config.location.toLowerCase())) return false;
      if (config.verifiedOnly && !profile.selfieVerified) return false;
      if (config.hasJobOnly && !profile.jobTitle) return false;

      return true;
    });
  };

  const matchingCount = getMatchingSubjects().length;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  };

  const startAutoLiker = async () => {
    if (isRunning) return;
    
    const toProcess = getMatchingSubjects().slice(0, config.maxLikes);
    if (toProcess.length === 0) {
      addLog("⚠ No profiles match criteria");
      return;
    }

    setIsRunning(true);
    setProgress({ current: 0, total: toProcess.length, liked: 0 });
    addLog(`Starting auto-liker for ${toProcess.length} profiles`);

    let likedCount = 0;
    for (let i = 0; i < toProcess.length; i++) {
      if (!isRunning) break;

      const subject = toProcess[i];
      const profile = getProfile(subject);
      const name = profile.firstName || "Unknown";

      setProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        const success = await onLike(subject, config.customComment || undefined);
        if (success) {
          likedCount++;
          addLog(`✓ Liked ${name}, ${profile.age || "?"}`);
          setProgress((prev) => ({ ...prev, liked: prev.liked + 1 }));
        } else {
          addLog(`✗ Failed: ${name}`);
        }
      } catch {
        addLog(`✗ Error: ${name}`);
      }

      if (i < toProcess.length - 1) {
        await new Promise((r) => setTimeout(r, config.delaySeconds * 1000));
      }
    }

    addLog(`Finished! Liked ${likedCount} profiles`);
    setIsRunning(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Configuration */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-gray-900 font-medium mb-5 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-gray-400" />
            Configuration
          </h2>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-amber-700 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Use responsibly. Excessive automation may result in account restrictions.
            </p>
          </div>

          {/* Likes remaining */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Daily Likes Remaining</span>
              <span className="text-2xl font-bold text-gray-900">{likeLimit?.likesLeft ?? "?"}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Min Age</label>
                <input
                  type="number"
                  value={config.minAge}
                  onChange={(e) => setConfig({ ...config, minAge: parseInt(e.target.value) || 18 })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Max Age</label>
                <input
                  type="number"
                  value={config.maxAge}
                  onChange={(e) => setConfig({ ...config, maxAge: parseInt(e.target.value) || 99 })}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                  disabled={isRunning}
                />
              </div>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Location Filter</label>
              <input
                type="text"
                value={config.location}
                onChange={(e) => setConfig({ ...config, location: e.target.value })}
                placeholder="e.g. Los Angeles"
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500 placeholder:text-gray-400"
                disabled={isRunning}
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.verifiedOnly}
                  onChange={(e) => setConfig({ ...config, verifiedOnly: e.target.checked })}
                  disabled={isRunning}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-600 text-sm">Verified only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hasJobOnly}
                  onChange={(e) => setConfig({ ...config, hasJobOnly: e.target.checked })}
                  disabled={isRunning}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-600 text-sm">Has job</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Delay (sec)</label>
                <input
                  type="number"
                  value={config.delaySeconds}
                  onChange={(e) => setConfig({ ...config, delaySeconds: Math.max(1, parseInt(e.target.value) || 3) })}
                  min={1}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Max Likes</label>
                <input
                  type="number"
                  value={config.maxLikes}
                  onChange={(e) => setConfig({ ...config, maxLikes: Math.max(1, parseInt(e.target.value) || 10) })}
                  min={1}
                  className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500"
                  disabled={isRunning}
                />
              </div>
            </div>

            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Comment (optional)</label>
              <input
                type="text"
                value={config.customComment}
                onChange={(e) => setConfig({ ...config, customComment: e.target.value })}
                placeholder="e.g. Love your profile!"
                className="w-full mt-2 px-3 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:border-pink-500 placeholder:text-gray-400"
                disabled={isRunning}
              />
            </div>

            {/* Matching count */}
            <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span><strong className="text-gray-900">{matchingCount}</strong> profiles match criteria</span>
            </div>

            {/* Start/Stop button */}
            <button
              onClick={isRunning ? () => setIsRunning(false) : startAutoLiker}
              disabled={matchingCount === 0 || (likeLimit?.likesLeft === 0)}
              className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                isRunning
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  : "gradient-btn text-white"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop ({progress.current}/{progress.total})
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Auto-Liker
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Log */}
      <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-gray-900 font-medium mb-4 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          Activity Log
        </h2>
        
        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{progress.current}/{progress.total} processed • {progress.liked} liked</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-sm border border-gray-100">
          {log.length === 0 ? (
            <p className="text-gray-400">Waiting for activity...</p>
          ) : (
            log.map((entry, i) => (
              <div
                key={i}
                className={`py-0.5 ${
                  entry.includes("✓") ? "text-green-600" :
                  entry.includes("✗") ? "text-red-600" :
                  entry.includes("⚠") ? "text-amber-600" :
                  "text-gray-500"
                }`}
              >
                {entry}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
