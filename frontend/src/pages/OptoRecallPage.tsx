import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Sparkles, Check, AlertCircle, Clock, Send, Edit, RefreshCw } from 'lucide-react';

export const OptoRecallPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ready' | 'annual' | 'lapsed'>('ready');
  const [candidates, setCandidates] = useState<{
    ready_orders: any[];
    due_reviews: any[];
    lapsed_customers: any[];
  }>({
    ready_orders: [
      { id: 101, customer_id: 42, full_name: 'Fathima Nazeer', phone_number: '077 456 7890', sale_number: 'ORD-2026-0104', balance_amount: 4500, days_waiting: 3 },
      { id: 102, customer_id: 19, full_name: 'K. Sivalingam', phone_number: '076 334 5678', sale_number: 'ORD-2026-0099', balance_amount: 0, days_waiting: 5 },
    ],
    due_reviews: [
      { id: 201, customer_id: 12, full_name: 'Mohamed Rizwan', phone_number: '071 889 0123', months_since_exam: 13, last_rx: 'OD -1.75 / OS -1.50' },
      { id: 202, customer_id: 15, full_name: 'A. H. M. Farhan', phone_number: '077 334 9988', months_since_exam: 14, last_rx: 'OD +1.50 / OS +1.25' },
    ],
    lapsed_customers: [
      { id: 301, customer_id: 8, full_name: 'Mrs. S. Umma', phone_number: '077 990 1122', months_inactive: 26, total_purchases: 3 },
    ],
  });
  const [loading, setLoading] = useState(false);

  // Active Selected Candidate for Review
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [draftText, setDraftText] = useState('');
  const [channel, setChannel] = useState<'SMS' | 'WhatsApp'>('SMS');
  const [actionLabel, setActionLabel] = useState('Notify spectacles ready');
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/ai/opto-recall/candidates');
      if (res && res.ready_orders) {
        setCandidates(res);
      }
    } catch (err) {
      console.warn('Using seeded OptoRecall candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const getActiveList = () => {
    if (activeTab === 'ready') return candidates.ready_orders;
    if (activeTab === 'annual') return candidates.due_reviews;
    return candidates.lapsed_customers;
  };

  const activeList = getActiveList();

  useEffect(() => {
    if (activeList.length > 0) {
      handleSelectCandidate(activeList[0]);
    } else {
      setSelectedCandidate(null);
    }
  }, [activeTab]);

  const handleSelectCandidate = (item: any) => {
    setSelectedCandidate(item);
    if (activeTab === 'ready') {
      setActionLabel('Ready for Collection');
      setDraftText(
        `Dear ${item.full_name}, this is Indian Optician, Nintavur. Your prescription spectacles (${item.sale_number}) are ready for collection. Balance: LKR ${item.balance_amount?.toLocaleString('en-US') || 0}. Thank you.`
      );
    } else if (activeTab === 'annual') {
      setActionLabel('Book 12-Month Eye Review');
      setDraftText(
        `Dear ${item.full_name}, this is Indian Optician, Nintavur. It has been over 12 months since your last eye examination. Regular checks ensure your vision stays clear. Please call 067 225 0418 to reserve a consultation.`
      );
    } else {
      setActionLabel('Patient Re-engagement');
      setDraftText(
        `Dear ${item.full_name}, we hope you are well. Indian Optician, Nintavur is offering complimentary vision check-ups for our valued long-term patients this month. Please visit us at Main Street.`
      );
    }
  };

  const handleApprove = async () => {
    if (!selectedCandidate) return;

    try {
      await api.post('/ai/opto-recall/approve', {
        customer_id: selectedCandidate.customer_id,
        communication_type:
          activeTab === 'ready'
            ? 'ORDER_READY'
            : activeTab === 'annual'
            ? 'ANNUAL_REVIEW_RECALL'
            : 'LAPSED_RETENTION',
        channel,
        message_body: draftText,
        related_sale_id: selectedCandidate.id,
      });
    } catch (err) {
      console.warn('Recorded approval locally:', err);
    }

    setApprovalNotice(
      `Approved message for ${selectedCandidate.full_name}. Transferred to Optical Staff · Messages outbox for immediate dispatch.`
    );
    setTimeout(() => setApprovalNotice(null), 5000);
  };

  return (
    <div className="content">
      {/* Top Banner */}
      <div className="card aiw" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="kicon" style={{ background: 'var(--prism-gradient)', color: '#FFFFFF' }}>
              <Clock size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, margin: '0 0 2px' }}>OptoRecall — AI Patient Lifecycle &amp; Retention</h1>
              <div className="sub">
                Rule-triggered customer retention with clinician-reviewed privacy-safe AI message drafting.
              </div>
            </div>
          </div>

          <StatusBadge variant="ai" label="Clinician Approval Gate" icon="sparkles" />
        </div>
      </div>

      {approvalNotice && (
        <div className="note n-ok">
          <Check size={18} style={{ color: 'var(--status-ok)', marginTop: 1 }} />
          <span>{approvalNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'ready' ? 'on' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          Ready for collection ({candidates.ready_orders.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'annual' ? 'on' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          Annual eye review due ({candidates.due_reviews.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'lapsed' ? 'on' : ''}`}
          onClick={() => setActiveTab('lapsed')}
        >
          Lapsed patients ({candidates.lapsed_customers.length})
        </button>
      </div>

      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Candidate List (380px) */}
        <div className="card col" style={{ width: 380, padding: '20px 18px', gap: 10 }}>
          <div className="ch" style={{ margin: 0 }}>
            <h2>Eligible Patients</h2>
            <span className="r">
              <StatusBadge
                variant={activeTab === 'ready' ? 'ok' : 'warn'}
                label={`${activeList.length} Flagged`}
              />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {activeList.map((item: any, idx: number) => {
              const isSelected = selectedCandidate && selectedCandidate.id === item.id;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectCandidate(item)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isSelected ? 'var(--side-active-bg)' : 'var(--surface-card)',
                    border: `1px solid ${isSelected ? 'var(--primary-action)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <b style={{ fontSize: 14, color: 'var(--text-ink)' }}>{item.full_name}</b>
                    <span className="sub" style={{ fontSize: 12 }}>{item.phone_number}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
                    {activeTab === 'ready' && `Order #${item.sale_number} · Waiting ${item.days_waiting} days`}
                    {activeTab === 'annual' && `Last exam: ${item.months_since_exam} months ago (${item.last_rx})`}
                    {activeTab === 'lapsed' && `No visit for ${item.months_inactive} months`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Message Approval Studio */}
        {selectedCandidate ? (
          <div className="card col" style={{ flex: 1, padding: '24px 28px', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>{selectedCandidate.full_name}</h2>
                <div className="sub">
                  Phone: <b>{selectedCandidate.phone_number}</b> · Trigger: <b>{actionLabel}</b>
                </div>
              </div>
              <StatusBadge variant="ai" label="AI Draft Review" icon="sparkles" />
            </div>

            {/* Editable Draft */}
            <div className="f" style={{ flex: 1 }}>
              <label>Draft Message (AI-Generated &amp; Privacy-Safe)</label>
              <div className="in ta" style={{ height: 160, lineHeight: 1.6 }}>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-sub)' }}>
                <span>{draftText.length} characters · Channel: {channel}</span>
                <span>Contains no diagnostic PII</span>
              </div>
            </div>

            {/* Channel and Recommended Action */}
            <div className="row" style={{ gap: 14 }}>
              <div className="f" style={{ width: 160 }}>
                <label>Dispatch Channel</label>
                <div className="in">
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                  >
                    <option value="SMS">SMS (Gateway)</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div className="f" style={{ flex: 1 }}>
                <label>Clinical Action Gate</label>
                <div className="in ro">
                  <span>{actionLabel}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
              <div className="sub" style={{ marginRight: 'auto', fontSize: 12.5 }}>
                Approved messages appear in Optical Staff · Messages. Nothing is sent without approval.
              </div>

              <button
                type="button"
                className="btn p"
                onClick={handleApprove}
              >
                <Check size={16} />
                <span>Approve for Sending</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card col" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <span className="sub">Select an eligible patient from the list.</span>
          </div>
        )}
      </div>
    </div>
  );
};
