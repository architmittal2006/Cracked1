import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Send } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';

export const CompanyPostCasePage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Profitability' as const,
    sector: '',
    difficulty: 'Standard' as const,
    confidentiality: 'Public' as const,
  });

  const handleSubmit = () => {
    alert('Case posted for review!');
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/company/dashboard" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-4 mt-4">
            <Building2 className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Post New Case</h1>
          </div>
        </div>

        <div className="glass-card p-6">
          <label className="block mb-4">
            <span className="text-sm font-medium text-white mb-2 block">Case Title</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., D2C Brand Margin Erosion"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="text-sm font-medium text-white mb-2 block">Description</span>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the business problem..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white min-h-[120px] focus:outline-none focus:border-amber-500"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="text-sm font-medium text-white mb-2 block">Problem Type</span>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option>Market Sizing</option>
                <option>Profitability</option>
                <option>Market Entry</option>
                <option>Operational</option>
                <option>Pricing</option>
                <option>M&A</option>
                <option>Growth & Retention</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-white mb-2 block">Difficulty</span>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option>Standard</option>
                <option>High</option>
                <option>Chaos</option>
              </select>
            </label>
          </div>

          <label className="block mb-6">
            <span className="text-sm font-medium text-white mb-2 block">Confidentiality Tier</span>
            <select
              value={formData.confidentiality}
              onChange={(e) => setFormData({ ...formData, confidentiality: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
            >
              <option>Public</option>
              <option>Private</option>
              <option>Confidential</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Post Case
          </button>
        </div>
      </div>
    </PageWrapper>
  );
};
