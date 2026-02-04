"use client";

import { useState, useEffect } from "react";
import { User, Crown, Shield, Heart, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface MyProfileProps {
  apiUrl: string;
}

export default function MyProfile({ apiUrl }: MyProfileProps) {
  const [account, setAccount] = useState<any>(null);
  const [traits, setTraits] = useState<any>(null);
  const [likeLimit, setLikeLimit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAccount(),
      fetchTraits(),
      fetchLikeLimit(),
    ]);
    setLoading(false);
  };

  const fetchAccount = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/account`);
      const data = await res.json();
      if (data.success) {
        setAccount(data.account);
      }
    } catch (err) {
      console.error("Failed to fetch account:", err);
    }
  };

  const fetchTraits = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/traits`);
      const data = await res.json();
      if (data.success) {
        setTraits(data.traits);
      }
    } catch (err) {
      console.error("Failed to fetch traits:", err);
    }
  };

  const fetchLikeLimit = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/like-limit`);
      const data = await res.json();
      if (data.success) {
        setLikeLimit(data.limit);
      }
    } catch (err) {
      console.error("Failed to fetch like limit:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accountData = account?.account || {};
  const subscription = account?.subscription || {};
  const traitsArray = traits?.traits || [];

  // Parse traits into a more usable format
  const traitMap: Record<string, string> = {};
  traitsArray.forEach((t: any) => {
    if (t.userInput) {
      traitMap[t.id] = t.userInput;
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* API Limitation Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Limited Profile Access</h3>
            <p className="text-amber-700 text-sm mt-1">
              Hinge doesn&apos;t expose your own profile through their API — you can only view other users&apos; profiles. 
              To see your profile, use the Hinge app directly.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Limits */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Daily Limits
            </h2>
            <button
              onClick={fetchLikeLimit}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 text-center border border-pink-100">
              <p className="text-4xl font-bold text-pink-600">
                {likeLimit?.likesLeft ?? "?"}
              </p>
              <p className="text-sm text-pink-600/70 mt-1">Likes Left</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 text-center border border-purple-100">
              <p className="text-4xl font-bold text-purple-600">
                {likeLimit?.superlikesLeft ?? "?"}
              </p>
              <p className="text-sm text-purple-600/70 mt-1">Roses Left</p>
            </div>
          </div>

          {likeLimit?.freeSuperlikesLeft !== undefined && likeLimit.freeSuperlikesLeft > 0 && (
            <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-amber-100">
              <p className="text-amber-700 text-sm">
                <Sparkles className="w-4 h-4 inline mr-1" />
                {likeLimit.freeSuperlikesLeft} Free Rose{likeLimit.freeSuperlikesLeft > 1 ? "s" : ""} Available!
              </p>
            </div>
          )}
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-amber-500" />
            Account Status
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Subscription</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription?.active 
                  ? "bg-amber-100 text-amber-700" 
                  : "bg-gray-100 text-gray-600"
              }`}>
                {subscription?.active ? "Premium" : "Free"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Previous Premium</span>
              <span className={accountData.previousSubscriber ? "text-green-600" : "text-gray-400"}>
                {accountData.previousSubscriber ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-500">Bought Roses Before</span>
              <span className={accountData.previousSuperlikePurchaser ? "text-green-600" : "text-gray-400"}>
                {accountData.previousSuperlikePurchaser ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-gray-500">Bought Boosts Before</span>
              <span className={accountData.previousBoostPurchaser ? "text-green-600" : "text-gray-400"}>
                {accountData.previousBoostPurchaser ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        {/* What Hinge Knows About You */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:col-span-2">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-blue-500" />
            Your Stored Preferences
          </h2>

          {traitsArray.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {traitsArray.map((trait: any) => (
                <div key={trait.id} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                    {trait.id.replace(/_/g, " ")}
                  </p>
                  <p className="text-gray-900">
                    {trait.userInput || <span className="text-gray-300 italic">Not set</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No preference data available</p>
          )}
        </div>
      </div>

      {/* Account UUID */}
      {account?.accountUUID && (
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Account ID: <span className="font-mono">{account.accountUUID}</span>
          </p>
        </div>
      )}

      {/* Raw Data Debug */}
      <details className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <summary className="p-4 cursor-pointer text-gray-500 text-sm hover:text-gray-700">
          View Raw API Data
        </summary>
        <div className="p-4 pt-0 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Account</p>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 text-gray-600">
              {JSON.stringify(account, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Traits</p>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 text-gray-600">
              {JSON.stringify(traits, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Like Limits</p>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 text-gray-600">
              {JSON.stringify(likeLimit, null, 2)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
}
