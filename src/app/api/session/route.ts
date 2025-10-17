//src/app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, device_info } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // End any active sessions for this user
    await supabase
      .from('sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        end_reason: 'system',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id)
      .eq('is_active', true);

    // Create new session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id,
        device_info: device_info || null,
        is_active: true,
        started_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data }, { status: 201 });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Get active session for user
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ session: data || null }, { status: 200 });
  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}