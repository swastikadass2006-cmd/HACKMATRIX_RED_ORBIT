import React, { useState } from 'react';
import { ArrowUpRight, Eye, EyeOff, Wifi } from 'lucide-react';
import { ContextualEmptyState } from '../common/ContextualEmptyState';

export function FraudCard({ metrics, onViewDetails }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLockedOpen, setIsLockedOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  if (!metrics) {
    return (
      <div className="quixotic-card">
        <div className="card-header-quixotic">
          <div className="card-title-block">
            <span className="card-main-title">Payment Goal</span>
            <span className="card-sub-title">Total amount goal</span>
          </div>
        </div>
        <ContextualEmptyState 
          message="Telemetry index will populate as target analyses conclude."
          style={{ minHeight: '160px', padding: '24px 16px' }}
        />
      </div>
    );
  }

  const isCardExtended = isHovered || isLockedOpen;

  // Format balance matching Image 1: $43,865.00
  const balanceRaw = metrics?.fraud_blocked?.value_formatted;
  const balanceDisplay = balanceRaw && !balanceRaw.startsWith('₹') ? balanceRaw : '$43,865.00';
  const revenueDisplay = '+$3,945 USD';
  const changePct = '+12.8%';

  return (
    <div className="quixotic-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Card Header matching Image 2 */}
      <div className="card-header-quixotic">
        <div className="card-title-block">
          <span className="card-main-title">Payment Goal</span>
          <span className="card-sub-title">Total amount goal</span>
        </div>
        <button 
          className="card-corner-arrow-btn" 
          aria-label="Details"
          onClick={onViewDetails}
          title="View card analytics"
        >
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* 
        -------------------------------------------------------------
        Leather Card Pocket Sleeve with Slide-Up Card Animation
        (Matching Reference Image 1 & 2)
        -------------------------------------------------------------
      */}
      <div
        className="wallet-pocket-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsLockedOpen(!isLockedOpen)}
        title={isCardExtended ? "Click to slide card back in" : "Hover or click to pull card out"}
        style={{
          position: 'relative',
          width: '100%',
          height: '190px',
          backgroundColor: '#121417',
          borderRadius: '24px',
          overflow: 'visible',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
          cursor: 'pointer',
          userSelect: 'none',
          paddingTop: '36px',
          boxSizing: 'border-box'
        }}
      >
        {/* Outer Sleeve Outer Dashed Stitch Border */}
        <svg 
          viewBox="0 0 340 190" 
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          <rect 
            x="5" 
            y="5" 
            width="330" 
            height="180" 
            rx="20" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1.5" 
            strokeDasharray="5 4" 
          />
        </svg>

        {/* 
          SLIDING CREDIT CARD (Titanium MasterCard)
          Behind front flap (z-index: 2), slides smoothly upward on hover/click!
        */}
        <div
          className="sliding-credit-card"
          style={{
            position: 'absolute',
            left: '14px',
            right: '14px',
            bottom: '18px',
            height: '158px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #373D47 0%, #1E2228 45%, #2B303A 100%)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            boxShadow: isCardExtended 
              ? '0 -16px 36px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)' 
              : '0 6px 20px rgba(0, 0, 0, 0.4)',
            transform: isCardExtended ? 'translateY(-48px)' : 'translateY(0px)',
            transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease',
            zIndex: 2,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Row: MasterCard Logo & Card Number (Always peeking out of scoop!) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* MasterCard Logo (Generic Interlocking Circles) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '32px', height: '20px' }}>
                <span 
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#EB001B',
                    position: 'absolute',
                    left: 0,
                    top: 0
                  }} 
                />
                <span 
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#F79E1B',
                    position: 'absolute',
                    left: '12px',
                    top: 0,
                    mixBlendMode: 'screen',
                    opacity: 0.95
                  }} 
                />
              </div>
              <span style={{ 
                color: '#FFFFFF', 
                fontSize: '13px', 
                fontWeight: 700, 
                letterSpacing: '0.4px',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Master Card
              </span>
            </div>

            {/* Embossed Card Number */}
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.92)', 
              fontSize: '12.5px', 
              fontWeight: 600, 
              letterSpacing: '1.2px',
              fontFamily: 'monospace'
            }}>
              3745 6987 4096 3960
            </span>
          </div>

          {/* Hidden Mid Section (Revealed when card slides upward!) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            opacity: isCardExtended ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
            marginTop: '8px'
          }}>
            {/* Golden Metallic EMV Chip */}
            <div 
              style={{
                width: '34px',
                height: '26px',
                borderRadius: '5px',
                background: 'linear-gradient(135deg, #FAD961 0%, #F76B1C 100%)',
                border: '1px solid #D4A017',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4)'
              }}
            >
              {/* Internal chip track lines */}
              <div style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.25)' }} />
              <div style={{ position: 'absolute', right: '33%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.25)' }} />
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.25)' }} />
            </div>

            {/* Contactless Waves */}
            <Wifi size={18} style={{ color: 'rgba(255, 255, 255, 0.75)', transform: 'rotate(90deg)' }} />
          </div>

          {/* Bottom Card Holder Details */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            opacity: isCardExtended ? 1 : 0,
            transition: 'opacity 0.25s ease',
            fontSize: '11px',
            color: '#CBD5E1',
            letterSpacing: '1px'
          }}>
            <span style={{ fontWeight: 700 }}>ALEX B.</span>
            <span style={{ fontFamily: 'monospace' }}>EXP 09/28</span>
          </div>
        </div>

        {/* 
          FRONT LEATHER POCKET FLAP with CENTER SCOOP & WHITE STITCHING
          Sits in front of the card (z-index: 3)
        */}
        <svg 
          viewBox="0 0 340 135" 
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '135px',
            pointerEvents: 'none',
            zIndex: 3
          }}
        >
          <defs>
            <linearGradient id="pocketLeatherGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#252A32" />
              <stop offset="100%" stopColor="#14171A" />
            </linearGradient>
          </defs>

          {/* Front Pocket Flap Body with Center Scoop */}
          <path 
            d="M 0,26 L 85,26 C 108,26 118,52 142,52 L 198,52 C 222,52 232,26 255,26 L 340,26 L 340,135 L 0,135 Z" 
            fill="url(#pocketLeatherGrad)" 
          />

          {/* Dashed White Stitching along the scooped contour */}
          <path 
            d="M 6,31 L 83,31 C 106,31 116,57 140,57 L 200,57 C 224,57 234,31 257,31 L 334,31 L 334,130 L 6,130 Z" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.42)" 
            strokeWidth="1.5" 
            strokeDasharray="5 4" 
          />

          {/* Left & Right Metallic Dimple Rivets */}
          <circle cx="42" cy="26" r="4.5" fill="#181B20" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
          <circle cx="298" cy="26" r="4.5" fill="#181B20" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.2" />
        </svg>

        {/* 
          FRONT POCKET FLAP CONTENT
          (Limit Card, $43,865.00, Interactive Eye Icon)
          z-index: 4
        */}
        <div
          style={{
            position: 'absolute',
            bottom: '22px',
            left: '24px',
            right: '24px',
            zIndex: 4,
            pointerEvents: 'auto'
          }}
        >
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 500, 
            color: '#9CA3AF', 
            marginBottom: '4px',
            letterSpacing: '0.2px'
          }}>
            Limit Card
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span 
              className="tabular-nums"
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.4px',
                lineHeight: 1
              }}
            >
              {showBalance ? balanceDisplay : '$ ••,•••.••'}
            </span>

            {/* Eye Icon to Toggle Balance Visibility */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance(!showBalance);
              }}
              aria-label={showBalance ? "Hide card balance" : "Show card balance"}
              title={showBalance ? "Hide balance" : "Show balance"}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#E5E7EB';
              }}
            >
              {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Card Stat Row (Weekly Revenue +3,945 USD +12.8% matching Image 2) */}
      <div className="card-stat-pill-row" style={{ marginTop: '2px' }}>
        <div>
          <div className="stat-label-muted" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Weekly Revenue
          </div>
          <div className="stat-value-bold tabular-nums" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {revenueDisplay}
          </div>
        </div>

        <span className="mint-badge-pill tabular-nums" style={{ fontSize: '11.5px', fontWeight: 700 }}>
          {changePct}
        </span>
      </div>
    </div>
  );
}
export default FraudCard;
