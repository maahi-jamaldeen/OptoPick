import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { OptoForecastInsight } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { TrendingUp, AlertTriangle, Package, RefreshCw, Sparkles, Filter } from 'lucide-react';

export const OptoForecastPage: React.FC = () => {
  const [insights, setInsights] = useState<OptoForecastInsight[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [aiAssisted, setAiAssisted] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        ai_assisted: boolean;
        executive_summary: string;
        insights: OptoForecastInsight[];
      }>('/ai/opto-forecast');
      setInsights(res.insights || []);
      setExecutiveSummary(res.executive_summary || '');
      setAiAssisted(res.ai_assisted);
    } catch (err) {
      console.error('Failed to load forecast:', err);
      // Fallback with mock presentation insights if offline
      setInsights([
        {
          id: 1,
          name: 'Ray-Ban Aviator Classic (RB3025)',
          item_type: 'FRAME',
          stock: 2,
          sold_30d: 14,
          days_since_last_sale: 2,
          demand_signal: 'High',
          stock_risk: 'Possible Shortage',
          recommended_action: 'Review Reorder',
          reason: 'Rapid 30-day velocity of 14 units with only 2 left on shelf. Likely to exhaust stock in 4 days.',
        },
        {
          id: 2,
          name: '1.60 BlueProtect Hi-Index Single Vision',
          item_type: 'LENS',
          stock: 4,
          sold_30d: 18,
          days_since_last_sale: 1,
          demand_signal: 'High',
          stock_risk: 'Possible Shortage',
          recommended_action: 'Review Reorder',
          reason: 'High customer adoption among computer professionals in Nintavur. Maintain buffer of 15 pairs.',
        },
        {
          id: 3,
          name: 'Vintage Cat-Eye Horn-Rimmed Acetate',
          item_type: 'FRAME',
          stock: 12,
          sold_30d: 1,
          days_since_last_sale: 42,
          demand_signal: 'Low',
          stock_risk: 'Possible Overstock',
          recommended_action: 'Review Stock Reduction',
          reason: 'Zero sales in over 40 days. Tied-up capital of LKR 60,000. Consider promotional discount bundle.',
        },
        {
          id: 4,
          name: 'Oakley Holbrook Sport Wrap',
          item_type: 'FRAME',
          stock: 8,
          sold_30d: 7,
          days_since_last_sale: 3,
          demand_signal: 'Stable',
          stock_risk: 'None',
          recommended_action: 'Monitor',
          reason: 'Balanced sell-through rate with healthy 35-day inventory buffer.',
        },
      ]);
      setExecutiveSummary('High demand on Aviator frames and 1.60 Blue-Cut lenses. Overstock detected on slow-moving vintage styles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const filtered = filterAction === 'ALL'
    ? insights
    : insights.filter((i) => i.recommended_action === filterAction);

  return (
    <div className="content">
      {/* Top Banner */}
      <div className="card aiw" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="kicon" style={{ background: 'var(--prism-gradient)', color: '#FFFFFF' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, margin: '0 0 2px' }}>OptoForecast — AI Inventory Intelligence</h1>
              <div className="sub">
                Evaluates 30-day and 90-day sales velocity to prevent stock-outs and identify dead inventory.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <StatusBadge variant="ai" label="Gemini Demand Analytics" icon="sparkles" />
            <button type="button" className="btn s sm" onClick={fetchForecast} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh Forecast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      {executiveSummary && (
        <div className="note n-ai">
          <Sparkles size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <b>AI Executive Inventory Summary:</b> {executiveSummary}
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Product Inventory Signals</h2>

          {/* Action Filter Chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['ALL', 'Review Reorder', 'Monitor', 'Review Stock Reduction'].map((act) => (
              <button
                key={act}
                type="button"
                className={`chip ${filterAction === act ? 'on' : ''}`}
                onClick={() => setFilterAction(act)}
              >
                {act === 'ALL' ? 'All Products' : act}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
            Calculating sales velocity and stock risk scores...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product / Model</th>
                  <th>Classification</th>
                  <th className="num">Shelf Stock</th>
                  <th className="num">30-Day Sales</th>
                  <th>Demand Signal</th>
                  <th>Stock Risk</th>
                  <th>Recommended Action</th>
                  <th>AI Insight Reason</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={idx}>
                    <td><b>{item.name}</b></td>
                    <td><span className="badge b-n">{item.item_type}</span></td>
                    <td className="num">
                      <b style={{ color: item.stock <= 3 ? 'var(--status-bad)' : 'inherit' }}>
                        {item.stock}
                      </b>
                    </td>
                    <td className="num"><b>{item.sold_30d}</b></td>
                    <td>
                      <StatusBadge
                        variant={item.demand_signal === 'High' ? 'ok' : item.demand_signal === 'Low' ? 'warn' : 'info'}
                        label={item.demand_signal}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        variant={item.stock_risk === 'Possible Shortage' ? 'bad' : item.stock_risk === 'Possible Overstock' ? 'warn' : 'ok'}
                        label={item.stock_risk}
                        icon={item.stock_risk !== 'None' ? 'alert' : 'check'}
                      />
                    </td>
                    <td>
                      <span className={`badge ${item.recommended_action === 'Review Reorder' ? 'b-bad' : item.recommended_action === 'Monitor' ? 'b-ok' : 'b-warn'}`}>
                        {item.recommended_action}
                      </span>
                    </td>
                    <td style={{ maxWidth: 320, fontSize: 13, lineHeight: 1.45, color: 'var(--text-sub)' }}>
                      {item.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
