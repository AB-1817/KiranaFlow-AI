'use client'

import { getRiskLevel } from '@/lib/utils'

interface AssessmentBannerProps {
  confidenceScore: number
  fraudFlags: string[]
  safeLoanBand: string
  monthlyRevenue: number
  netCashFlow: number
}

export default function AssessmentBanner({
  confidenceScore,
  fraudFlags,
  safeLoanBand,
  monthlyRevenue,
  netCashFlow,
}: AssessmentBannerProps) {
  const riskLevel = getRiskLevel(confidenceScore, fraudFlags)

  const getStatusConfig = () => {
    if (riskLevel === 'low' && confidenceScore >= 0.75) {
      return {
        status: 'RECOMMENDED FOR APPROVAL',
        bgColor: 'bg-gradient-to-r from-forest-50 to-emerald-50',
        borderColor: 'border-forest-500',
        textColor: 'text-forest-900',
        iconColor: 'text-forest-600',
        icon: (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        message: 'Case meets all underwriting criteria for credit facility',
        action: 'Ready for senior review and disbursement',
      }
    } else if (riskLevel === 'medium' || (confidenceScore >= 0.5 && confidenceScore < 0.75)) {
      return {
        status: 'MANUAL REVIEW REQUIRED',
        bgColor: 'bg-gradient-to-r from-amber-50 to-yellow-50',
        borderColor: 'border-amber-500',
        textColor: 'text-amber-900',
        iconColor: 'text-amber-600',
        icon: (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
        message: 'Additional verification needed before approval',
        action: 'Escalate to senior analyst for detailed assessment',
      }
    } else {
      return {
        status: 'HIGH RISK - FURTHER INVESTIGATION',
        bgColor: 'bg-gradient-to-r from-red-50 to-rose-50',
        borderColor: 'border-red-500',
        textColor: 'text-red-900',
        iconColor: 'text-red-600',
        icon: (
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        message: 'Multiple risk indicators detected',
        action: 'Comprehensive due diligence and field verification required',
      }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`${config.bgColor} border-l-4 ${config.borderColor} rounded-xl p-6 shadow-md mb-6`}
    >
      <div className="flex items-start">
        <div className={`${config.iconColor} flex-shrink-0`}>{config.icon}</div>
        <div className="ml-5 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xl font-bold ${config.textColor} tracking-tight`}>
              {config.status}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.textColor} bg-white bg-opacity-60 uppercase tracking-wide`}>
              {riskLevel} Risk
            </span>
          </div>
          <p className={`text-sm ${config.textColor} mb-1 font-medium`}>{config.message}</p>
          <p className={`text-xs ${config.textColor} opacity-75 mb-4`}>{config.action}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-current border-opacity-20">
              <p className="text-xs font-semibold opacity-75 mb-1">Recommended Band</p>
              <p className={`text-lg font-bold ${config.textColor}`}>{safeLoanBand}</p>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-current border-opacity-20">
              <p className="text-xs font-semibold opacity-75 mb-1">Confidence Level</p>
              <p className={`text-lg font-bold ${config.textColor}`}>
                {(confidenceScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-current border-opacity-20">
              <p className="text-xs font-semibold opacity-75 mb-1">Risk Category</p>
              <p className={`text-lg font-bold ${config.textColor} uppercase`}>{riskLevel}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
