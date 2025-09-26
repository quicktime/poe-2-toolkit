import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const classFilter = searchParams.get('class')
  const userFilter = searchParams.get('user_id')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let query = supabase
      .from('build_templates')
      .select(`
        *,
        profiles!inner(display_name, avatar_url),
        likes:build_likes(count)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (classFilter) {
      query = query.eq('class', classFilter)
    }

    if (userFilter) {
      query = query.eq('user_id', userFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Build fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // For now, allow anonymous creation with a placeholder user
      console.log('Anonymous build creation - using placeholder')
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.class || !body.level) {
      return NextResponse.json(
        { error: 'Missing required fields: title, class, level' },
        { status: 400 }
      )
    }

    // Prepare build data
    const buildData = {
      user_id: user?.id || null, // Allow null for anonymous
      title: body.title,
      description: body.description || null,
      class: body.class,
      ascendancy: body.ascendancy || null,
      level: body.level,
      passive_tree: body.passive_tree || {},
      equipment: body.equipment || {},
      skills: body.skills || {},
      stats: body.stats || {},
      league: body.league || null,
      patch_version: body.patch_version || '0.3',
      complexity: body.complexity || null,
      tags: body.tags || [],
      is_public: body.is_public !== undefined ? body.is_public : true
    }

    const { data, error } = await supabase
      .from('build_templates')
      .insert(buildData)
      .select()
      .single()

    if (error) {
      console.error('Build creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}