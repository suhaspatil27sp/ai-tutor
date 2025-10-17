//src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, user_id, message_text, temp_id, sender_type = 'user' } = body;

    if (!session_id || !user_id || !message_text) {
      return NextResponse.json(
        { error: 'session_id, user_id, and message_text are required' },
        { status: 400 }
      );
    }

    // Save user message to database
    const { data: userMessage, error: userMessageError } = await supabase
      .from('messages')
      .insert({
        session_id,
        user_id,
        sender_type,
        message_text,
        temp_id: temp_id || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Supabase error:', userMessageError);
      return NextResponse.json(
        { error: 'Failed to save message', details: userMessageError.message },
        { status: 500 }
      );
    }

    // Update session last_message_at
    await supabase
      .from('sessions')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', session_id);

    // TODO: Replace with actual AI integration (n8n webhook or Claude API)
    // For now, generate a simple echo response
    const botResponse = generateBotResponse(message_text);

    // Save bot response
    const { data: botMessage, error: botMessageError } = await supabase
      .from('messages')
      .insert({
        session_id,
        user_id,
        sender_type: 'bot',
        message_text: botResponse,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (botMessageError) {
      console.error('Supabase error:', botMessageError);
      return NextResponse.json(
        { error: 'Failed to save bot response', details: botMessageError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        userMessage,
        botMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');
    const limit = searchParams.get('limit') || '50';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('sent_at', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: data }, { status: 200 });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Temporary bot response generator - replace with actual AI integration
function generateBotResponse(userMessage: string): string {
  const responses = [
    "That's an interesting question! Let me help you understand that better.",
    "Great question! Let's break this down step by step.",
    "I see what you're asking. Here's how we can approach this...",
    "That's a smart observation! Let me explain further.",
    "Good thinking! Let's explore this concept together.",
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('help') || lowerMessage.includes('don\'t understand')) {
    return "I'm here to help! Can you tell me which part you're finding challenging? We can work through it together.";
  }
  
  if (lowerMessage.includes('thank')) {
    return "You're welcome! Keep up the great work. Is there anything else you'd like to learn about?";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI tutor. What would you like to learn about today?";
  }

  return responses[Math.floor(Math.random() * responses.length)];
}