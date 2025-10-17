//src/app/api/session/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.last_message_at !== undefined) {
      updates.last_message_at = new Date().toISOString();
    }

    if (body.current_concept !== undefined) {
      updates.current_concept = body.current_concept;
    }

    if (body.concepts_covered !== undefined) {
      updates.concepts_covered = body.concepts_covered;
    }

    if (body.is_active !== undefined) {
      updates.is_active = body.is_active;
      if (!body.is_active) {
        updates.ended_at = new Date().toISOString();
        updates.end_reason = body.end_reason || 'explicit';
      }
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data }, { status: 200 });
  } catch (error) {
    console.error('Session update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    // Mark session as inactive instead of deleting
    const { data, error } = await supabase
      .from('sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        end_reason: 'explicit',
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to end session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data }, { status: 200 });
  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}