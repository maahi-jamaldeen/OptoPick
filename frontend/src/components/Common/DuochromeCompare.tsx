import React from 'react';

interface ExamRxData {
  date: string;
  od_sph: number | string;
  od_cyl: number | string;
  os_sph: number | string;
  os_cyl: number | string;
  pd?: number | string;
}

interface DuochromeCompareProps {
  before?: ExamRxData | null;
  now?: ExamRxData | null;
}

export const DuochromeCompare: React.FC<DuochromeCompareProps> = ({ before, now }) => {
  const formatDiopter = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '') return '—';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '—';
    return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
  };

  const hasBefore = before && (before.od_sph !== undefined && before.od_sph !== null);
  const hasNow = now && (now.od_sph !== undefined && now.od_sph !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="duo">
        {/* Before Panel (Red) */}
        <div className="r" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4>Before ({hasBefore ? (before?.date || 'Historical') : 'Baseline Visit'})</h4>
          {hasBefore ? (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 4 }}>
                <div>
                  <div className="big tabular-nums" style={{ fontSize: 26 }}>
                    {formatDiopter(before.od_sph)}
                  </div>
                  <span className="sub" style={{ fontSize: 12 }}>OD (Right SPH)</span>
                </div>
                <div>
                  <div className="big tabular-nums" style={{ fontSize: 26 }}>
                    {formatDiopter(before.os_sph)}
                  </div>
                  <span className="sub" style={{ fontSize: 12 }}>OS (Left SPH)</span>
                </div>
              </div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>
                CYL: OD {formatDiopter(before.od_cyl)} · OS {formatDiopter(before.os_cyl)}
              </div>
            </>
          ) : (
            <div style={{ padding: '6px 0', fontSize: 12.5, lineHeight: 1.5 }}>
              <b style={{ display: 'block', marginBottom: 2 }}>No Prior Historical Prescription</b>
              <span className="sub" style={{ fontSize: 12 }}>
                This is the inaugural clinical exam for this patient. Future eye examinations will automatically compare against this record.
              </span>
            </div>
          )}
        </div>

        {/* Now Panel (Green) */}
        <div className="g" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4>Now ({hasNow ? (now?.date || 'Current Exam') : 'Awaiting Exam'})</h4>
          {hasNow ? (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', marginTop: 4 }}>
                <div>
                  <div className="big tabular-nums" style={{ fontSize: 26 }}>
                    {formatDiopter(now.od_sph)}
                  </div>
                  <span className="sub" style={{ fontSize: 12 }}>OD (Right SPH)</span>
                </div>
                <div>
                  <div className="big tabular-nums" style={{ fontSize: 26 }}>
                    {formatDiopter(now.os_sph)}
                  </div>
                  <span className="sub" style={{ fontSize: 12 }}>OS (Left SPH)</span>
                </div>
              </div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.85 }}>
                CYL: OD {formatDiopter(now.od_cyl)} · OS {formatDiopter(now.os_cyl)}
              </div>
            </>
          ) : (
            <div style={{ padding: '6px 0', fontSize: 12.5, lineHeight: 1.5 }}>
              <b style={{ display: 'block', marginBottom: 2 }}>No Active Examination Recorded</b>
              <span className="sub" style={{ fontSize: 12 }}>
                Conduct an examination to view current refraction measurements.
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="sub" style={{ fontSize: 12, paddingLeft: 4 }}>
        Duochrome clinical refraction comparison, labelled Before and Now to ensure accessibility across color perceptions.
      </div>
    </div>
  );
};
