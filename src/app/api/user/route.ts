//src/app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, age, grade_level, education_board, email } = body;

    // Validate required fields
    if (!first_name || !age || !grade_level || !education_board) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate age and grade level
    if (age < 11 || age > 18) {
      return NextResponse.json(
        { error: 'Age must be between 11 and 18' },
        { status: 400 }
      );
    }

    if (grade_level < 6 || grade_level > 12) {
      return NextResponse.json(
        { error: 'Grade level must be between 6 and 12' },
        { status: 400 }
      );
    }

    // Create user with Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        first_name,
        last_name: last_name || null,
        age,
        grade_level,
        education_board,
        email: email || null,
        onboarding_completed: true,
        last_active_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create user', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) {
    console.error('User creation error:', error);
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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'User not found', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ...updates } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}