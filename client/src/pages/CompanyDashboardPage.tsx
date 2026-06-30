import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Users, FileText, TrendingUp, Award } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { TrackBadge } from '../components/TrackBadge';

export const CompanyDashboardPage: React.FC = () => {
  // Mock company data
  const companyCases = [
    { id: 'c001', title: 'D2C Brand Margin Erosion', submissions: 12, status: 'In Review', track: 'curated_case' as const },
    { id: 'c002', title: 'Hospital Network Merger', submissions: 8, status: 'Open', track: 'curated_case' as const },
  ];

  const topContributors = [
    { name: 'Marcus Vance', credibility: 4840, casesSolved: 34 },
    { name: 'Elena Rostova', credibility: 5197, casesSolved: 28 },
    { name: 'Devon Kincaid', credibility: 4410, casesSolved: 19 },
  ];

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">Company Dashboard</h1>
          </div>
          <Link to="/company/cases/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Post Case
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Cases', value: '2', icon: FileText, color: 'text-cyan-400' },
            { label: 'Total Submissions', value: '20', icon: Users, color: 'text-violet-400' },
            { label: 'Merge Bonuses Issued', value: '3', icon: Award, color: 'text-amber-400' },
            { label: 'Avg Solution Quality', value: '4.2', icon: TrendingUp, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-xs text-slate-500 uppercase mb-1">{stat.label}</div>
              <div className="text-2xl font-black font-mono text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Cases</h2>
            <div className="space-y-3">
              {companyCases.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white">{c.title}</h3>
                    <TrackBadge track={c.track} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{c.submissions} submissions</span>
                    <span className="text-emerald-400">{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Contributors</h2>
            <div className="space-y-3">
              {topContributors.map((contributor, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{contributor.name}</div>
                    <div className="text-xs text-slate-500">{contributor.casesSolved} cases solved</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">{contributor.credibility.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">credibility</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
