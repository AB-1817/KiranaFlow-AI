'use client'

interface FraudFlagsProps {
  flags: string[]
  locationTier: string
  geoMultiplier: number
}

export default function FraudFlags({ flags, locationTier, geoMultiplier }: FraudFlagsProps) {
  const hasIssues = flags.some(
    (flag) =>
      !flag.toLowerCase().includes('no fraud') &&
      !flag.toLowerCase().includes('no issues')
  )

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>

      {/* Location Info */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Location Tier</p>
            <p className="text-lg font-semibold text-blue-700">{locationTier}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-900">Geo Multiplier</p>
            <p className="text-lg font-semibold text-blue-700">{geoMultiplier.toFixed(2)}x</p>
          </div>
        </div>
      </div>

      {/* Fraud Flags */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Fraud Detection Results</p>
        {flags.length === 0 ? (
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-green-800">No fraud indicators detected</span>
          </div>
        ) : (
          <div className="space-y-2">
            {flags.map((flag, index) => {
              const isWarning = hasIssues
              return (
                <div
                  key={index}
                  className={`flex items-start p-3 rounded-lg border ${
                    isWarning
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                      isWarning ? 'text-yellow-600' : 'text-green-600'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isWarning ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    )}
                  </svg>
                  <span
                    className={`text-sm ${
                      isWarning ? 'text-yellow-800' : 'text-green-800'
                    }`}
                  >
                    {flag}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
