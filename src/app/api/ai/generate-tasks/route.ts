import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { mood, energyLevel, availableTime } = await request.json();

    const prompt = `Generate 3 engaging and personalized tasks to help combat boredom. Consider the following:

Mood: ${mood}
Energy Level: ${energyLevel}/10
Available Time: ${availableTime} minutes

Generate tasks that are:
- Appropriate for the given mood and energy level
- Realistic for the available time
- Engaging and varied (mix of physical, mental, creative, social activities)
- Specific and actionable
- Fun and interesting

Format each task as a JSON object with:
- title: A catchy, specific task title
- description: A brief explanation of what to do
- category: One of [personal, work, health, learning, creative, social]
- priority: One of [low, medium, high] based on energy level and mood

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
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}
