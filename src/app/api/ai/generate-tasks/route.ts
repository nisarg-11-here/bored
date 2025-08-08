import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI features are not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    // Initialize OpenAI client inside the function
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { mood, energyLevel, availableTime, scheduleNotes } = await request.json();

    const prompt = `Generate 3 engaging and personalized tasks to help combat boredom. Consider the following:

Mood: ${mood}
Energy Level: ${energyLevel}/10
Available Time: ${availableTime} minutes
${scheduleNotes ? `Schedule Notes: ${scheduleNotes}` : ''}

Generate tasks that are:
- Appropriate for the given mood and energy level
- Realistic for the available time
- Engaging and varied (mix of physical, mental, creative, social activities)
- Specific and actionable
- Fun and interesting

Format each task as a JSON object with:
- title: A catchy, specific task title
- description: A brief explanation of what to do
- category: One of [personal, work, health, learning, creative, social, focus, planning]
- priority: One of [low, medium, high] based on energy level and mood
- estimatedTime: Estimated time in minutes (number)

Return only a JSON array of 3 task objects, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates engaging tasks to combat boredom. Always respond with valid JSON arrays only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const tasks = JSON.parse(response);
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('AI task generation error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or missing' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate tasks. Please try again.' },
      { status: 500 }
    );
  }
}
