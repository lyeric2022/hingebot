"use client";

import { useMemo } from "react";
import { Users, MapPin, Briefcase, GraduationCap, TrendingUp, ShieldCheck } from "lucide-react";
import type { Subject } from "@/app/page";

interface AnalyticsProps {
  subjects: Subject[];
  standouts: Subject[];
}

export default function Analytics({ subjects, standouts }: AnalyticsProps) {
  const stats = useMemo(() => {
    const profiles = subjects.map((s) => s.profile?.profile || s.profile || {});

    // Age distribution
    const ages: Record<string, number> = {};
    profiles.forEach((p) => {
      if (p.age) {
        const bucket = `${Math.floor(p.age / 5) * 5}-${Math.floor(p.age / 5) * 5 + 4}`;
        ages[bucket] = (ages[bucket] || 0) + 1;
      }
    });

    // Location distribution
    const locations: Record<string, number> = {};
    profiles.forEach((p) => {
      const loc = p.location?.name || p.hometown || "Unknown";
      locations[loc] = (locations[loc] || 0) + 1;
    });

    // Job titles
    const jobs: Record<string, number> = {};
    profiles.forEach((p) => {
      if (p.jobTitle) {
        jobs[p.jobTitle] = (jobs[p.jobTitle] || 0) + 1;
      }
    });

    // Schools
    const schools: Record<string, number> = {};
    profiles.forEach((p) => {
      if (p.school) {
        schools[p.school] = (schools[p.school] || 0) + 1;
      }
    });

    // Verified percentage
    const verifiedCount = profiles.filter((p) => p.selfieVerified).length;
    const verifiedPercent = profiles.length > 0 ? Math.round((verifiedCount / profiles.length) * 100) : 0;

    // Average age
    const agesArr = profiles.map((p) => p.age).filter(Boolean) as number[];
    const avgAge = agesArr.length > 0 ? Math.round(agesArr.reduce((a, b) => a + b, 0) / agesArr.length) : 0;

    return {
      total: subjects.length,
      standoutCount: standouts.length,
      ages: Object.entries(ages).sort((a, b) => a[0].localeCompare(b[0])),
      locations: Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 8),
      jobs: Object.entries(jobs).sort((a, b) => b[1] - a[1]).slice(0, 8),
      schools: Object.entries(schools).sort((a, b) => b[1] - a[1]).slice(0, 8),
      verifiedPercent,
      avgAge,
    };
  }, [subjects, standouts]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: { 
    title: string; 
    value: string | number; 
    subtitle?: string;
    icon: any; 
    color: string 
  }) => (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const DistributionChart = ({ title, data, icon: Icon }: { 
    title: string; 
    data: [string, number][]; 
    icon: any 
  }) => {
    const max = Math.max(...data.map((d) => d[1]), 1);
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <h3 className="text-gray-900 font-medium mb-4 flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          {title}
        </h3>
        <div className="space-y-3">
          {data.map(([label, count]) => (
            <div key={label} className="group">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 truncate max-w-[60%]" title={label}>{label}</span>
                <span className="text-gray-400">{count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">No data</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Profiles" 
          value={stats.total} 
          icon={Users} 
          color="bg-pink-500" 
        />
        <StatCard 
          title="Standouts" 
          value={stats.standoutCount}
          subtitle="Featured profiles"
          icon={TrendingUp} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Average Age" 
          value={stats.avgAge}
          subtitle="Years old"
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Verified" 
          value={`${stats.verifiedPercent}%`}
          subtitle="Of profiles"
          icon={ShieldCheck} 
          color="bg-green-500" 
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionChart title="Age Distribution" data={stats.ages} icon={TrendingUp} />
        <DistributionChart title="Top Locations" data={stats.locations} icon={MapPin} />
        <DistributionChart title="Common Jobs" data={stats.jobs} icon={Briefcase} />
        <DistributionChart title="Schools" data={stats.schools} icon={GraduationCap} />
      </div>
    </div>
  );
}
