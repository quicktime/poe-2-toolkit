import { createClient } from '@/lib/supabase/client'

interface LocalStorageBuildTemplate {
  id: string;
  name: string;
  description: string;
  character: {
    name: string;
    level: number;
    class: string;
    ascendancy?: string;
  };
  stats: {
    dps: number;
    life: number;
    mana: number;
    energyShield: number;
    spirit: number;
  };
  equipment: any[];
  passives: number[];
  skillGems: any[];
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  created: string;
  version: string;
}

export class BuildMigrationService {
  private supabase = createClient()

  /**
   * Migrate build templates from localStorage to Supabase
   */
  async migrateBuilds(): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      // Get builds from localStorage
      const localBuilds = this.getLocalBuilds()

      if (localBuilds.length === 0) {
        console.log('No builds to migrate')
        return results
      }

      console.log(`Found ${localBuilds.length} builds to migrate`)

      // Migrate each build
      for (const localBuild of localBuilds) {
        try {
          await this.migrateSingleBuild(localBuild)
          results.success++
        } catch (error) {
          results.failed++
          results.errors.push(
            `Failed to migrate "${localBuild.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      // If all successful, optionally clear localStorage
      if (results.failed === 0) {
        this.archiveLocalBuilds(localBuilds)
      }

      return results
    } catch (error) {
      console.error('Migration failed:', error)
      throw error
    }
  }

  /**
   * Get builds from localStorage
   */
  private getLocalBuilds(): LocalStorageBuildTemplate[] {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem('poe2-build-templates')
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('Failed to parse localStorage builds:', error)
      return []
    }
  }

  /**
   * Migrate a single build to Supabase
   */
  private async migrateSingleBuild(localBuild: LocalStorageBuildTemplate) {
    // Transform local format to database format
    const buildData = {
      title: localBuild.name,
      description: localBuild.description,
      class: localBuild.character.class,
      ascendancy: localBuild.character.ascendancy || null,
      level: localBuild.character.level,
      passive_tree: {
        nodes: localBuild.passives,
        jewels: []
      },
      equipment: localBuild.equipment,
      skills: localBuild.skillGems,
      stats: localBuild.stats,
      league: 'Standard', // Default league
      patch_version: localBuild.version || '0.3',
      complexity: localBuild.complexity,
      tags: localBuild.tags,
      is_public: true // Default to public
    }

    const { data, error } = await this.supabase
      .from('build_templates')
      .insert(buildData)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    console.log(`Migrated build: ${localBuild.name} -> ID: ${data.id}`)
    return data
  }

  /**
   * Archive local builds after successful migration
   */
  private archiveLocalBuilds(builds: LocalStorageBuildTemplate[]) {
    if (typeof window === 'undefined') return

    // Archive to a backup key
    localStorage.setItem(
      'poe2-build-templates-backup',
      JSON.stringify({
        backupDate: new Date().toISOString(),
        builds
      })
    )

    // Clear the main storage
    localStorage.removeItem('poe2-build-templates')
    console.log('Local builds archived and cleared')
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    if (typeof window === 'undefined') return false

    const localBuilds = localStorage.getItem('poe2-build-templates')
    return !!localBuilds && localBuilds !== '[]'
  }

  /**
   * Get migration status
   */
  static getMigrationStatus(): {
    hasLocalBuilds: boolean;
    buildCount: number;
    hasBackup: boolean;
  } {
    if (typeof window === 'undefined') {
      return { hasLocalBuilds: false, buildCount: 0, hasBackup: false }
    }

    const localBuilds = localStorage.getItem('poe2-build-templates')
    const backup = localStorage.getItem('poe2-build-templates-backup')

    let buildCount = 0
    if (localBuilds) {
      try {
        const parsed = JSON.parse(localBuilds)
        buildCount = Array.isArray(parsed) ? parsed.length : 0
      } catch {}
    }

    return {
      hasLocalBuilds: !!localBuilds && localBuilds !== '[]',
      buildCount,
      hasBackup: !!backup
    }
  }
}