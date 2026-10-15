import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { CheckCircle2, XCircle, Play, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [testSummary, setTestSummary] = useState<any | null>(null);
  const [running, setRunning] = useState(false);

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const summary = await api.runTests();
      setTestSummary(summary);
    } catch (err: any) {
      alert(`Test run error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Automated Integration Test Runner
            </h2>
            <p className="text-xs text-slate-500">
              Executes backend integration tests verifying decimal-safe calculations, double-allocation prevention, and ACID operations.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunTests}
          disabled={running}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Executing Tests...' : 'Run All Automated Tests'}
        </button>
      </div>

      {/* Summary Scorecard */}
      {testSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded p-4 text-xs">
            <span className="text-slate-500 font-medium">Total Test Cases</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{testSummary.total}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-4 text-xs">
            <span className="text-emerald-700 font-medium">Assertions Passed</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{testSummary.passed}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-4 text-xs">
            <span className="text-rose-700 font-medium">Assertions Failed</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{testSummary.failed}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-4 text-xs">
            <span className="text-slate-500 font-medium">Total Duration</span>
            <div className="text-2xl font-bold font-mono text-slate-700 mt-1">{testSummary.durationMs}ms</div>
          </div>
        </div>
      )}

      {/* Test Results Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="p-3 border-b border-slate-200 font-bold text-xs text-slate-800 flex justify-between items-center">
          <span>Test Suite Results</span>
          {testSummary && (
            <span className="text-[11px] font-mono text-slate-400">
              Executed at {new Date(testSummary.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {testSummary ? (
            testSummary.results.map((res: any, idx: number) => (
              <div key={idx} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/60">
                <div className="flex items-start gap-3">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{res.name}</span>
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {res.category}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{res.message}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono text-[11px]">
                  <span className={`font-semibold ${res.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {res.passed ? 'PASSED' : 'FAILED'}
                  </span>
                  <div className="text-slate-400 text-[10px]">{res.durationMs}ms</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              Click &quot;Run All Automated Tests&quot; to verify the platform.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
