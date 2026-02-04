"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SwipeView from "@/components/SwipeView";
import GridView from "@/components/GridView";
import StandoutsView from "@/components/StandoutsView";
import Analytics from "@/components/Analytics";
import AutoLiker from "@/components/AutoLiker";
import MyProfile from "@/components/MyProfile";
import SavedProfiles from "@/components/SavedProfiles";
import Header from "@/components/Header";
import { Grid3X3, Layers, Star, Zap, BarChart3, User, FolderHeart } from "lucide-react";

export interface Subject {
  subjectId: string;
  ratingToken: string;
  recId?: string;
  profile?: any;
  content?: any;
}

export interface LikeLimit {
  likesLeft: number;
  superlikesLeft: number;
  freeSuperlikesLeft: number;
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [standouts, setStandouts] = useState<Subject[]>([]);
  const [likeLimit, setLikeLimit] = useState<LikeLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("grid");

  const API_URL = "http://localhost:8080";

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchRecommendations(),
      fetchStandouts(),
      fetchLikeLimit(),
    ]);
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recommendations`);
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Cannot connect to API");
    }
  };

  const loadMoreProfiles = async (
    targetCount: number,
    onProgress: (current: number, added: number) => void
  ): Promise<void> => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    const maxAttempts = Math.ceil(targetCount / 10); // Be more conservative
    let allSubjects = [...subjects];
    const seenIds = new Set(allSubjects.map(s => s.subjectId));
    let consecutiveErrors = 0;
    let consecutiveEmpty = 0;
    
    for (let attempt = 0; attempt < maxAttempts && allSubjects.length < targetCount; attempt++) {
      try {
        const res = await fetch(`${API_URL}/api/recommendations`);
        
        // Handle rate limiting
        if (!res.ok) {
          consecutiveErrors++;
          console.warn(`API error (${res.status}), waiting longer... (${consecutiveErrors} errors)`);
          
          if (consecutiveErrors >= 5) {
            console.error("Too many errors, stopping");
            onProgress(allSubjects.length, -1); // Signal error
            break;
          }
          
          // Exponential backoff: 5s, 10s, 15s, 20s...
          await delay(5000 * consecutiveErrors);
          continue;
        }
        
        consecutiveErrors = 0; // Reset on success
        const data = await res.json();
        
        if (data.success && data.subjects) {
          let addedThisBatch = 0;
          for (const subj of data.subjects) {
            if (!seenIds.has(subj.subjectId)) {
              seenIds.add(subj.subjectId);
              allSubjects.push(subj);
              addedThisBatch++;
            }
          }
          
          setSubjects([...allSubjects]);
          onProgress(allSubjects.length, addedThisBatch);
          
          // Track consecutive empty batches
          if (addedThisBatch === 0) {
            consecutiveEmpty++;
            if (consecutiveEmpty >= 3) {
              console.log("No new profiles after 3 attempts, stopping");
              break;
            }
          } else {
            consecutiveEmpty = 0;
          }
        }
        
        // Longer delay between requests (3-5 seconds random)
        if (attempt < maxAttempts - 1 && allSubjects.length < targetCount) {
          const waitTime = 3000 + Math.random() * 2000;
          await delay(waitTime);
        }
      } catch (err) {
        console.error("Error loading more:", err);
        consecutiveErrors++;
        if (consecutiveErrors >= 3) break;
        await delay(5000);
      }
    }
  };

  const fetchStandouts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/standouts`);
      const data = await res.json();
      if (data.success) {
        setStandouts(data.standouts || []);
      }
    } catch (err) {
      console.error("Failed to fetch standouts:", err);
    }
  };

  const fetchLikeLimit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/like-limit`);
      const data = await res.json();
      if (data.success) {
        setLikeLimit(data.limit);
      }
    } catch (err) {
      console.error("Failed to fetch like limit:", err);
    }
  };

  const handleLike = async (subject: Subject, comment?: string) => {
    try {
      const profile = subject.profile?.profile || subject.profile;
      const photos = profile?.photos || [];
      const contentId = photos[0]?.contentId;

      const res = await fetch(`${API_URL}/api/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: subject.subjectId,
          rating_token: subject.ratingToken,
          comment: comment || "",
          content_id: contentId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubjects((prev) => prev.filter((s) => s.subjectId !== subject.subjectId));
        fetchLikeLimit();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to like:", err);
      return false;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header
        onRefresh={fetchAll}
        likeLimit={likeLimit}
        profileCount={subjects.length}
        standoutCount={standouts.length}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={fetchAll}
                className="px-6 py-2.5 gradient-btn text-white rounded-xl font-medium"
              >
                Try Again
              </button>
            </div>
            <p className="mt-6 text-gray-400 text-sm font-mono">
              python api.py
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="swipe" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Swipe</span>
                </TabsTrigger>
                <TabsTrigger value="standouts" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Standouts</span>
                </TabsTrigger>
                <TabsTrigger value="auto" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <FolderHeart className="w-4 h-4" />
                  <span className="hidden sm:inline">Saved</span>
                </TabsTrigger>
                <TabsTrigger value="me" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Me</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="grid">
              <GridView
                subjects={subjects}
                onLike={handleLike}
                loading={loading}
                likeLimit={likeLimit}
                onLoadMore={loadMoreProfiles}
                apiUrl={API_URL}
              />
            </TabsContent>

            <TabsContent value="swipe">
              <SwipeView
                subjects={subjects}
                onLike={handleLike}
                onSkip={(subject) => {
                  setSubjects((prev) => prev.filter((s) => s.subjectId !== subject.subjectId));
                }}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="standouts">
              <StandoutsView
                standouts={standouts}
                onLike={handleLike}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="auto">
              <AutoLiker
                subjects={subjects}
                onLike={handleLike}
                likeLimit={likeLimit}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics subjects={subjects} standouts={standouts} />
            </TabsContent>

            <TabsContent value="saved">
              <SavedProfiles apiUrl={API_URL} />
            </TabsContent>

            <TabsContent value="me">
              <MyProfile apiUrl={API_URL} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
