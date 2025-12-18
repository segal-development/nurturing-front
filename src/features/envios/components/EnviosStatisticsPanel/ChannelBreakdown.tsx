/**
 * Channel Breakdown Component
 * Shows email vs SMS statistics
 */

import type { EnviosDailyStatsResponse } from '@/types/envios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, MessageSquare } from 'lucide-react'

interface ChannelBreakdownProps {
  data?: EnviosDailyStatsResponse
}

export function ChannelBreakdown({ data }: ChannelBreakdownProps) {
  if (!data) return null

  const totalEmail = data.estadisticas.reduce((sum, s) => sum + s.email_count, 0)
  const totalSms = data.estadisticas.reduce((sum, s) => sum + s.sms_count, 0)
  const total = totalEmail + totalSms

  const emailPercent = total > 0 ? (totalEmail / total) * 100 : 0
  const smsPercent = total > 0 ? (totalSms / total) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Email Card */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Mail className="h-5 w-5 text-segal-blue dark:text-segal-turquoise" />
            Emails
          </CardTitle>
          <CardDescription className="dark:text-white/60">
            Envíos por email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-segal-blue dark:text-segal-turquoise">
              {totalEmail}
            </div>
            <p className="text-sm text-segal-dark/60 dark:text-white/60 mt-1">
              {emailPercent.toFixed(1)}% del total
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-segal-blue/10 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-segal-blue dark:bg-segal-turquoise h-full transition-all"
              style={{ width: `${emailPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Card */}
      <Card className="dark:bg-slate-900 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <MessageSquare className="h-5 w-5 text-segal-green dark:text-emerald-400" />
            SMS
          </CardTitle>
          <CardDescription className="dark:text-white/60">
            Envíos por SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-segal-green dark:text-emerald-400">
              {totalSms}
            </div>
            <p className="text-sm text-segal-dark/60 dark:text-white/60 mt-1">
              {smsPercent.toFixed(1)}% del total
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-segal-green/10 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-segal-green dark:bg-emerald-500 h-full transition-all"
              style={{ width: `${smsPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChannelBreakdown
