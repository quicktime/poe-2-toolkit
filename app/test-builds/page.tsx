'use client'

import { useState, useEffect } from 'react'
import { BuildMigrationService } from '@/lib/supabase/migration'

export default function TestBuilds() {
  const [builds, setBuilds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [migrationStatus, setMigrationStatus] = useState<any>(null)
  const [testBuildCreated, setTestBuildCreated] = useState(false)

  useEffect(() => {
    checkMigrationStatus()
    fetchBuilds()
  }, [])

  const checkMigrationStatus = () => {
    const status = BuildMigrationService.getMigrationStatus()
    setMigrationStatus(status)
  }

  const fetchBuilds = async () => {
    try {
      const response = await fetch('/api/builds')
      const data = await response.json()
      setBuilds(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch builds:', error)
      setBuilds([])
    } finally {
      setLoading(false)
    }
  }

  const createTestBuild = async () => {
    try {
      const testBuild = {
        title: `Test Build - ${new Date().toLocaleTimeString()}`,
        description: 'This is a test build created from the test page',
        class: 'Warrior',
        ascendancy: 'Warbringer',
        level: 85,
        passive_tree: { nodes: [1, 2, 3, 4, 5], jewels: [] },
        equipment: [
          { slot: 'Weapon', name: 'Test Sword', type: 'Two-Handed Sword' }
        ],
        skills: [
          { name: 'Cyclone', level: 20, quality: 20 }
        ],
        stats: {
          dps: 150000,
          life: 5000,
          mana: 1200,
          energyShield: 0,
          spirit: 100
        },
        league: 'Standard',
        complexity: 'intermediate',
        tags: ['melee', 'tanky', 'league-starter'],
        is_public: true
      }

      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBuild)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Created build:', data)
        setTestBuildCreated(true)
        await fetchBuilds() // Refresh the list
      } else {
        const error = await response.json()
        console.error('Failed to create build:', error)
      }
    } catch (error) {
      console.error('Error creating test build:', error)
    }
  }

  const runMigration = async () => {
    try {
      const service = new BuildMigrationService()
      const results = await service.migrateBuilds()
      console.log('Migration results:', results)
      alert(`Migration complete! Success: ${results.success}, Failed: ${results.failed}`)
      checkMigrationStatus()
      await fetchBuilds()
    } catch (error) {
      console.error('Migration failed:', error)
      alert('Migration failed! Check console for details.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Supabase Build Templates Test</h1>

        {/* Migration Status */}
        {migrationStatus && migrationStatus.hasLocalBuilds && (
          <div className="bg-yellow-900 border border-yellow-500 rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">📦 Local Builds Detected</h2>
            <p>Found {migrationStatus.buildCount} build(s) in localStorage</p>
            <button
              onClick={runMigration}
              className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
            >
              Migrate to Supabase
            </button>
          </div>
        )}

        {/* Test Build Creation */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Test Build Creation</h2>
          {!testBuildCreated ? (
            <button
              onClick={createTestBuild}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
            >
              Create Test Build
            </button>
          ) : (
            <p className="text-green-400">✅ Test build created successfully!</p>
          )}
        </div>

        {/* Builds List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Database Builds ({builds.length})
          </h2>

          {loading ? (
            <p>Loading builds...</p>
          ) : builds.length === 0 ? (
            <p className="text-gray-400">
              No builds found. Create one above or migrate from localStorage.
            </p>
          ) : (
            <div className="space-y-4">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{build.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {build.class} {build.ascendancy && `- ${build.ascendancy}`} | Level {build.level}
                      </p>
                      {build.description && (
                        <p className="text-gray-300 mt-2">{build.description}</p>
                      )}
                      {build.tags && build.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {build.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-600 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {build.complexity && (
                          <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                            {build.complexity}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        ID: {build.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Test Info */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">API Endpoints Available:</h3>
          <ul className="space-y-1 text-sm font-mono text-gray-400">
            <li>GET /api/builds - List all public builds</li>
            <li>POST /api/builds - Create a new build</li>
            <li>GET /api/builds/[id] - Get specific build</li>
            <li>PATCH /api/builds/[id] - Update build</li>
            <li>DELETE /api/builds/[id] - Delete build</li>
          </ul>
        </div>
      </div>
    </div>
  )
}