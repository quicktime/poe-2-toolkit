'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabase() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [supabaseUrl, setSupabaseUrl] = useState<string>('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const supabase = createClient()

      // Get the Supabase URL from environment
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'
      setSupabaseUrl(url)

      // Test the connection by attempting to fetch from a public endpoint
      const { error: healthError } = await supabase
        .from('profiles')
        .select('count')
        .limit(0)

      if (healthError) {
        // This is expected if the table doesn't exist yet
        if (healthError.message.includes('relation') && healthError.message.includes('does not exist')) {
          setStatus('connected')
          setError('Connected to Supabase! Database schema not yet applied.')
        } else if (healthError.code === '42P01') {
          setStatus('connected')
          setError('Connected to Supabase! Please run the database migrations.')
        } else {
          setStatus('error')
          setError(healthError.message)
        }
      } else {
        setStatus('connected')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Supabase Connection Test</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Connection Status</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                status === 'connected' ? 'bg-green-500' :
                'bg-red-500'
              }`} />
              <span className="text-lg">
                {status === 'loading' && 'Testing connection...'}
                {status === 'connected' && '✅ Successfully connected to Supabase!'}
                {status === 'error' && '❌ Connection failed'}
              </span>
            </div>

            {supabaseUrl && (
              <div className="mt-4 p-3 bg-gray-700 rounded">
                <p className="text-sm text-gray-300">Supabase URL:</p>
                <p className="font-mono text-sm break-all">{supabaseUrl}</p>
              </div>
            )}

            {error && (
              <div className={`mt-4 p-3 rounded ${
                status === 'connected' ? 'bg-blue-900' : 'bg-red-900'
              }`}>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>

          {status === 'connected' ? (
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy the contents of <code className="bg-gray-700 px-2 py-1 rounded">supabase/migrations/001_initial_schema.sql</code></li>
              <li>Paste and run the SQL in the editor</li>
              <li>Refresh this page to verify tables are created</li>
            </ol>
          ) : status === 'error' ? (
            <div className="space-y-2">
              <p>Please check:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your Supabase URL and API key in <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code></li>
                <li>That your Supabase project is active</li>
                <li>Your internet connection</li>
              </ul>
            </div>
          ) : (
            <p>Checking connection...</p>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={testConnection}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Test Connection Again
          </button>
        </div>
      </div>
    </div>
  )
}