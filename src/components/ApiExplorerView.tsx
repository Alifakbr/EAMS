import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, Copy, Download, Code2, Globe } from 'lucide-react';
import { openApiSpec } from '../../server/openapi.ts';

export const ApiExplorerView: React.FC = () => {
  const [selectedEndpointKey, setSelectedEndpointKey] = useState<string>('/customers');
  const [selectedMethod, setSelectedMethod] = useState<string>('get');
  const [requestBodyJson, setRequestBodyJson] = useState<string>('{\n  "name": "Acme Drilling Ltd",\n  "type": "COMPANY",\n  "taxId": "US-EIN-99-123456",\n  "creditLimit": 150000\n}');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string> | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const endpointList = Object.entries(openApiSpec.paths).flatMap(([pathKey, methods]) =>
    Object.entries(methods).map(([methodKey, details]: [string, any]) => ({
      path: pathKey,
      method: methodKey.toUpperCase(),
      summary: details.summary || '',
      description: details.description || '',
      parameters: details.parameters || [],
    }))
  );

  const handleSelect = (path: string, method: string) => {
    setSelectedEndpointKey(path);
    setSelectedMethod(method.toLowerCase());
    setResponseStatus(null);
    setResponseBody(null);

    // Provide helpful sample bodies for POST endpoints
    if (path === '/customers' && method === 'POST') {
      setRequestBodyJson('{\n  "name": "Pinnacle Energy Contractors",\n  "type": "COMPANY",\n  "taxId": "US-EIN-55-90124",\n  "creditLimit": 200000,\n  "paymentTermsDays": 30\n}');
    } else if (path === '/products' && method === 'POST') {
      setRequestBodyJson('{\n  "sku": "GEN-APG-2000",\n  "name": "Atlas Power APG-2000 kVA Prime Generator",\n  "productType": "SERIALIZED",\n  "salesPrice": 125000,\n  "purchaseCost": 98000,\n  "stockQuantity": 1\n}');
    } else if (path === '/rentals' && method === 'POST') {
      setRequestBodyJson('{\n  "customerId": "CUST-001",\n  "assetIds": ["AST-1002"],\n  "rateType": "MONTHLY",\n  "durationUnits": 1,\n  "securityDeposit": 3000\n}');
    } else if (path.includes('/cancel') && method === 'POST') {
      setRequestBodyJson('{\n  "reason": "Customer project cancelled due to permit revision"\n}');
    } else if (path.includes('/extend') && method === 'POST') {
      setRequestBodyJson('{\n  "newReturnDate": "2026-05-15",\n  "additionalAmount": 2500\n}');
    } else {
      setRequestBodyJson('{}');
    }
  };

  const handleExecuteRequest = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody(null);
    const t0 = performance.now();

    // Replace parameter placeholder like {id} with a realistic seed ID
    let finalPath = selectedEndpointKey;
    if (finalPath.includes('{id}')) {
      if (finalPath.startsWith('/customers')) finalPath = finalPath.replace('{id}', 'CUST-001');
      else if (finalPath.startsWith('/products')) finalPath = finalPath.replace('{id}', 'PROD-001');
      else if (finalPath.startsWith('/quotations')) finalPath = finalPath.replace('{id}', 'QT-2026-001');
      else if (finalPath.startsWith('/sales-orders')) finalPath = finalPath.replace('{id}', 'SO-2026-001');
      else if (finalPath.startsWith('/rentals')) finalPath = finalPath.replace('{id}', 'RC-2026-001');
      else if (finalPath.startsWith('/deliveries')) finalPath = finalPath.replace('{id}', 'DO-2026-001');
      else if (finalPath.startsWith('/invoices')) finalPath = finalPath.replace('{id}', 'INV-2026-001');
      else if (finalPath.startsWith('/payments')) finalPath = finalPath.replace('{id}', 'PMT-2026-001');
    }

    try {
      const options: RequestInit = {
        method: selectedMethod.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'x-user-name': 'REST API Sandbox Explorer',
        },
      };

      if (['post', 'patch', 'put'].includes(selectedMethod.toLowerCase())) {
        options.body = requestBodyJson;
      }

      const res = await fetch(`/api/v1${finalPath}`, options);
      const duration = Math.round(performance.now() - t0);
      setResponseTimeMs(duration);
      setResponseStatus(res.status);

      const headersObj: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const json = await res.json().catch(() => ({ message: res.statusText }));
      setResponseBody(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setResponseTimeMs(Math.round(performance.now() - t0));
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSpec = () => {
    const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'apex_eams_openapi_v1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-3.5 border border-slate-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              OpenAPI 3.0 &amp; REST API Interactive Sandbox
            </h2>
            <p className="text-xs text-slate-500">
              Live REST gateway running at <span className="font-mono text-slate-800">/api/v1/*</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadSpec}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 rounded hover:bg-slate-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export openapi.json
        </button>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Endpoint Navigator (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-md p-3 max-h-[750px] overflow-y-auto space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Registered REST Endpoints ({endpointList.length})
          </div>

          <div className="space-y-1">
            {endpointList.map((ep, idx) => {
              const isSelected = selectedEndpointKey === ep.path && selectedMethod.toUpperCase() === ep.method;
              const isGet = ep.method === 'GET';
              const isPost = ep.method === 'POST';
              const isPatch = ep.method === 'PATCH';

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(ep.path, ep.method)}
                  className={`p-2 rounded border cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-slate-800 text-white'
                          : isGet
                          ? 'bg-blue-50 text-blue-700'
                          : isPost
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-medium truncate">{ep.path}</span>
                  </div>
                  <div className={`text-[11px] mt-1 font-sans ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {ep.summary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Request & Response Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-md p-5 space-y-4 max-h-[750px] overflow-y-auto">
          {/* Target URL Bar */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded font-mono ${
                selectedMethod.toUpperCase() === 'GET'
                  ? 'bg-blue-100 text-blue-800'
                  : selectedMethod.toUpperCase() === 'POST'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {selectedMethod.toUpperCase()}
            </span>
            <div className="flex-1 px-3 py-1.5 bg-slate-100 rounded font-mono text-xs text-slate-800 truncate">
              /api/v1{selectedEndpointKey}
            </div>
            <button
              onClick={handleExecuteRequest}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>

          {/* Request Payload Editor (for POST/PATCH) */}
          {['post', 'patch', 'put'].includes(selectedMethod.toLowerCase()) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Request Body (JSON):</span>
                <span className="text-[10px] text-slate-400 font-mono">application/json</span>
              </div>
              <textarea
                rows={6}
                value={requestBodyJson}
                onChange={(e) => setRequestBodyJson(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded border border-slate-800 outline-none leading-relaxed"
              />
            </div>
          )}

          {/* Live Response Panel */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Live Response:</span>
                {responseStatus !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {responseTimeMs !== null && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {responseTimeMs}ms
                  </span>
                )}
              </div>
            </div>

            {responseBody ? (
              <pre className="p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded border border-slate-800 overflow-x-auto max-h-96 leading-relaxed">
                {responseBody}
              </pre>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 rounded text-center text-xs text-slate-400 font-mono">
                Click &quot;Send Request&quot; above to execute live REST query.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
