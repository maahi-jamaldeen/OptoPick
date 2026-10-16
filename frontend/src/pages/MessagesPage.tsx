import React, { useState } from 'react';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Send, Check, Phone, MessageSquare, Clock, Copy, AlertCircle } from 'lucide-react';

interface QueuedMessage {
  id: number;
  patientName: string;
  phone: string;
  type: 'ORDER_READY' | 'ANNUAL_REVIEW' | 'LAPSED_RETENTION';
  approvalTime: string;
  status: 'READY' | 'SENT' | 'PENDING_APPROVAL';
  draftText: string;
  channel: 'SMS' | 'WhatsApp' | 'Email';
}

const initialMessages: QueuedMessage[] = [
  {
    id: 1,
    patientName: 'Fathima Nazeer',
    phone: '077 456 7890',
    type: 'ORDER_READY',
    approvalTime: 'Approved today 09:30 by Mr. Musthaq',
    status: 'READY',
    channel: 'SMS',
    draftText: 'Dear Fathima, your new prescription spectacles (INV-0418) are ready for collection at Indian Optician, Main Street, Nintavur. Please visit during clinic hours (9am-8pm). Balance payable: LKR 4,500. Thank you.',
  },
  {
    id: 2,
    patientName: 'Mohamed Rizwan',
    phone: '071 889 0123',
    type: 'ANNUAL_REVIEW',
    approvalTime: 'Approved today 08:45 by Mr. Musthaq',
    status: 'READY',
    channel: 'SMS',
    draftText: 'Dear Mr. Rizwan, this is Indian Optician, Nintavur. Your annual eye refraction review is now due. Please visit us or call 067 225 0418 to reserve a consultation time with Mr. Musthaq.',
  },
  {
    id: 3,
    patientName: 'K. Sivalingam',
    phone: '076 334 5678',
    type: 'ORDER_READY',
    approvalTime: 'Approved yesterday by Mr. Musthaq',
    status: 'READY',
    channel: 'WhatsApp',
    draftText: 'Dear Mr. Sivalingam, your prescription spectacles are fitted and ready for collection at Indian Optician, Nintavur. Your order is fully settled. Thank you for choosing us!',
  },
  {
    id: 4,
    patientName: 'Mrs. S. Umma',
    phone: '077 990 1122',
    type: 'LAPSED_RETENTION',
    approvalTime: 'Approved yesterday by Mr. Musthaq',
    status: 'READY',
    channel: 'SMS',
    draftText: 'Dear Mrs. Umma, we hope your vision is clear. It has been over 2 years since your last refraction at Indian Optician, Nintavur. We invite you for a complimentary vision check this month.',
  },
  {
    id: 5,
    patientName: 'Zainab Begum',
    phone: '075 112 3344',
    type: 'ORDER_READY',
    approvalTime: 'Sent today 10:15',
    status: 'SENT',
    channel: 'SMS',
    draftText: 'Dear Zainab, your spectacles are ready for collection at Indian Optician, Nintavur. Balance: LKR 0.',
  },
  {
    id: 6,
    patientName: 'A. H. M. Farhan',
    phone: '077 334 9988',
    type: 'ANNUAL_REVIEW',
    approvalTime: 'Waiting for Mr. Musthaq approval',
    status: 'PENDING_APPROVAL',
    channel: 'SMS',
    draftText: 'Dear Farhan, this is Indian Optician. Your 12-month eye check is due.',
  },
];

export const MessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<QueuedMessage[]>(initialMessages);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'READY' | 'SENT' | 'PENDING_APPROVAL'>('READY');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  const filteredMessages = messages.filter((m) => m.status === activeTab);
  const selectedMsg = messages.find((m) => m.id === selectedId) || filteredMessages[0];

  const handleSend = (msgId: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, status: 'SENT' } : m))
    );
    setDispatchSuccess(`Message successfully dispatched to ${selectedMsg?.patientName} (${selectedMsg?.phone}). Logged in customer communication history.`);
    setTimeout(() => setDispatchSuccess(null), 5000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Message text copied to clipboard for manual WhatsApp / SMS sending!');
  };

  return (
    <div className="content">
      {/* Notice Banner */}
      {dispatchSuccess && (
        <div className="note n-ok">
          <Check size={18} style={{ color: 'var(--status-ok)', marginTop: 1 }} />
          <span>{dispatchSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'READY' ? 'on' : ''}`}
          onClick={() => setActiveTab('READY')}
        >
          Ready to send ({messages.filter((m) => m.status === 'READY').length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'SENT' ? 'on' : ''}`}
          onClick={() => setActiveTab('SENT')}
        >
          Sent today ({messages.filter((m) => m.status === 'SENT').length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'PENDING_APPROVAL' ? 'on' : ''}`}
          onClick={() => setActiveTab('PENDING_APPROVAL')}
        >
          Waiting for approval ({messages.filter((m) => m.status === 'PENDING_APPROVAL').length})
        </button>
      </div>

      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Column: Messages List (380px) */}
        <div className="card col" style={{ width: 380, padding: '20px 18px', gap: 10 }}>
          <div className="ch" style={{ margin: 0 }}>
            <h2>Patient Queue</h2>
            <span className="r">
              <StatusBadge
                variant={activeTab === 'READY' ? 'ok' : activeTab === 'SENT' ? 'neutral' : 'warn'}
                label={`${filteredMessages.length} Messages`}
              />
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {filteredMessages.length === 0 ? (
              <div className="sub" style={{ padding: '24px 10px', textAlign: 'center' }}>
                No messages in this tab.
              </div>
            ) : (
              filteredMessages.map((m) => {
                const isSelected = selectedMsg && m.id === selectedMsg.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
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
                      <b style={{ fontSize: 14, color: 'var(--text-ink)' }}>{m.patientName}</b>
                      <span className="badge b-info" style={{ fontSize: 11 }}>
                        {m.channel}
                      </span>
                    </div>
                    <div className="sub" style={{ fontSize: 12 }}>
                      {m.type.replace(/_/g, ' ')} · {m.phone}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message Dispatch Studio */}
        {selectedMsg ? (
          <div className="card col" style={{ flex: 1, padding: '24px 28px', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>{selectedMsg.patientName}</h2>
                <div className="sub">
                  Recipient: <b>{selectedMsg.phone}</b> · {selectedMsg.approvalTime}
                </div>
              </div>
              <StatusBadge
                variant={selectedMsg.status === 'READY' ? 'ok' : selectedMsg.status === 'SENT' ? 'neutral' : 'warn'}
                label={selectedMsg.status === 'READY' ? 'Clinically Approved' : selectedMsg.status === 'SENT' ? 'Dispatched' : 'Pending Approval'}
                icon={selectedMsg.status === 'READY' ? 'check' : 'clock'}
              />
            </div>

            {/* Editable Dispatch Box */}
            <div className="f" style={{ flex: 1 }}>
              <label>Message Content (Approved by Optometrist)</label>
              <div className="in ta" style={{ height: 160, lineHeight: 1.6 }}>
                <textarea
                  value={selectedMsg.draftText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setMessages((prev) =>
                      prev.map((m) => (m.id === selectedMsg.id ? { ...m, draftText: text } : m))
                    );
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-sub)' }}>
                <span>{selectedMsg.draftText.length} characters · 1 SMS Segment</span>
                <span>Destination: Indian Optician SMS Gateway</span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className="btn s"
                onClick={() => handleCopy(selectedMsg.draftText)}
              >
                <Copy size={16} />
                <span>Copy to Clipboard</span>
              </button>

              <button
                type="button"
                className="btn p"
                disabled={selectedMsg.status === 'SENT'}
                onClick={() => handleSend(selectedMsg.id)}
              >
                <Send size={16} />
                <span>
                  {selectedMsg.status === 'SENT' ? 'Already Dispatched' : 'Dispatch via SMS / WhatsApp'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card col" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <span className="sub">Select a message from the queue to review and dispatch.</span>
          </div>
        )}
      </div>
    </div>
  );
};
