import React, { useState } from 'react';
import { Bot, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  section?: string;
}

interface AIValidatorProps {
  onValidate?: (issues: ValidationIssue[]) => void;
}

export const AIValidator: React.FC<AIValidatorProps> = ({ onValidate }) => {
  const [validating, setValidating] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const handleValidate = async () => {
    setValidating(true);
    // Mock AI validation - in production this would call an AI API
    setTimeout(() => {
      const mockIssues: ValidationIssue[] = [
        { type: 'warning', message: 'Problem framing could be more specific about the root cause', section: 'Problem Framing' },
        { type: 'info', message: 'Consider adding quantitative assumptions to support your analysis', section: 'Data Integrity' },
      ];
      setIssues(mockIssues);
      onValidate?.(mockIssues);
      setValidating(false);
    }, 1500);
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white text-sm">AI Validator</span>
        </div>
        <button
          type="button"
          onClick={handleValidate}
          disabled={validating}
          className="text-xs btn-secondary"
        >
          {validating ? 'Validating...' : 'Run Check'}
        </button>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, idx) => (
            <div key={idx} className={`flex items-start gap-2 text-xs p-2 rounded ${
              issue.type === 'error' ? 'bg-red-500/10 text-red-400' :
              issue.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              {issue.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
              {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {issue.type === 'info' && <CheckCircle className="w-4 h-4 shrink-0" />}
              <div>
                <span className="font-medium">{issue.section}: </span>
                <span>{issue.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && !validating && (
        <p className="text-xs text-slate-500">Run AI validation to check for completeness and quality issues.</p>
      )}
    </div>
  );
};
