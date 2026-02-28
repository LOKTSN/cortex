export function GraphView() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        {/* Simplified tree diagram */}
        <svg viewBox="0 0 400 300" className="mx-auto h-64 w-80">
          {/* Root */}
          <rect x="150" y="10" width="100" height="30" rx="6" fill="#1A1A1A" />
          <text x="200" y="30" textAnchor="middle" fill="white" fontSize="11" fontFamily="Inter">
            Transformers
          </text>

          {/* Lines to children */}
          <line x1="200" y1="40" x2="80" y2="80" stroke="#D4D4D4" strokeWidth="1.5" />
          <line x1="200" y1="40" x2="200" y2="80" stroke="#D4D4D4" strokeWidth="1.5" />
          <line x1="200" y1="40" x2="320" y2="80" stroke="#D4D4D4" strokeWidth="1.5" />

          {/* Level 1 */}
          <rect x="30" y="80" width="100" height="28" rx="6" fill="#F5F5F5" stroke="#E5E5E5" />
          <text x="80" y="99" textAnchor="middle" fill="#1A1A1A" fontSize="10" fontFamily="Inter">
            Attention
          </text>

          <rect x="150" y="80" width="100" height="28" rx="6" fill="#F5F5F5" stroke="#E5E5E5" />
          <text x="200" y="99" textAnchor="middle" fill="#1A1A1A" fontSize="10" fontFamily="Inter">
            FFN
          </text>

          <rect x="270" y="80" width="100" height="28" rx="6" fill="#F5F5F5" stroke="#E5E5E5" />
          <text x="320" y="99" textAnchor="middle" fill="#1A1A1A" fontSize="10" fontFamily="Inter">
            Pos. Encoding
          </text>

          {/* Lines to sub-children */}
          <line x1="80" y1="108" x2="40" y2="150" stroke="#D4D4D4" strokeWidth="1" />
          <line x1="80" y1="108" x2="120" y2="150" stroke="#D4D4D4" strokeWidth="1" />
          <line x1="320" y1="108" x2="290" y2="150" stroke="#D4D4D4" strokeWidth="1" />
          <line x1="320" y1="108" x2="350" y2="150" stroke="#D4D4D4" strokeWidth="1" />

          {/* Level 2 */}
          <rect x="0" y="150" width="80" height="24" rx="5" fill="#F5F5F5" stroke="#22C55E" strokeWidth="1.5" />
          <text x="40" y="166" textAnchor="middle" fill="#1A1A1A" fontSize="9" fontFamily="Inter">
            Sparse Attn
          </text>
          <text x="85" y="166" fill="#22C55E" fontSize="8" fontFamily="Inter" fontWeight="bold">
            (NEW)
          </text>

          <rect x="85" y="150" width="70" height="24" rx="5" fill="#F5F5F5" stroke="#E5E5E5" />
          <text x="120" y="166" textAnchor="middle" fill="#1A1A1A" fontSize="9" fontFamily="Inter">
            Multi-Head
          </text>

          <rect x="250" y="150" width="80" height="24" rx="5" fill="#F5F5F5" stroke="#E5E5E5" />
          <text x="290" y="166" textAnchor="middle" fill="#1A1A1A" fontSize="9" fontFamily="Inter">
            RoPE
          </text>

          <rect x="335" y="150" width="65" height="24" rx="5" fill="#F5F5F5" stroke="#22C55E" strokeWidth="1.5" />
          <text x="367" y="166" textAnchor="middle" fill="#1A1A1A" fontSize="9" fontFamily="Inter">
            ALiBi
          </text>
          <text x="367" y="185" fill="#22C55E" fontSize="8" fontFamily="Inter" fontWeight="bold" textAnchor="middle">
            (NEW)
          </text>
        </svg>

        <p className="mt-4 text-sm text-text-muted">Knowledge Graph — concept hierarchy</p>
      </div>
    </div>
  )
}
