"use client";

import { RefreshCw, Heart, Star, Users } from "lucide-react";
import type { LikeLimit } from "@/app/page";

interface HeaderProps {
  onRefresh: () => void;
  likeLimit: LikeLimit | null;
  profileCount: number;
  standoutCount: number;
}

export default function Header({ onRefresh, likeLimit, profileCount, standoutCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold gradient-text tracking-tight">
            HingeBot
          </h1>
          <span className="hidden sm:block h-6 w-px bg-gray-200" />
          <span className="hidden sm:block text-gray-400 text-sm">
            Dating Automation
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          {/* Stats Pills */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">{profileCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100">
              <Star className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-sm text-purple-600 font-medium">{standoutCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 rounded-full border border-pink-100">
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-sm text-pink-600 font-medium">{likeLimit?.likesLeft ?? "?"}</span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            title="Refresh all data"
          >
            <RefreshCw className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  );
}
