import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Increment view count
    await supabase.rpc('increment_build_views', { build_id: params.id })

    // Fetch build with related data
    const { data, error } = await supabase
      .from('build_templates')
      .select(`
        *,
        profiles!inner(display_name, avatar_url, poe_account_name),
        likes:build_likes(count),
        comments(count)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Build not found' },
          { status: 404 }
        )
      }
      console.error('Build fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if current user has liked this build
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: likeData } = await supabase
        .from('build_likes')
        .select('user_id')
        .eq('build_id', params.id)
        .eq('user_id', user.id)
        .single()

      data.is_liked = !!likeData
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check ownership
    const { data: existingBuild } = await supabase
      .from('build_templates')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!existingBuild || existingBuild.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this build' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update only allowed fields
    const updateData: any = {}
    const allowedFields = [
      'title', 'description', 'passive_tree', 'equipment',
      'skills', 'stats', 'complexity', 'tags', 'is_public'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('build_templates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Build update error:', error)
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  try {
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Delete (RLS will check ownership)
    const { error } = await supabase
      .from('build_templates')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Build delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}