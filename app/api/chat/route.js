import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
You are chatting with a user support bot that can help you with coding and data structures and algorithms (DSA). Whether you are a 12-year-old kid or a senior developer with 25+ years of experience, I'm here to assist you. Feel free to ask any questions or seek guidance on coding concepts, problem-solving techniques, or anything related to DSA. I'll do my best to provide clear and helpful explanations. Let's get started!
`;

export async function POST(request) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const data = await request.json();

    // Generate a completion from OpenAI
    const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Verify the correct model name
        messages: [
            { role: 'system', content: systemPrompt },
            ...data,
        ],
        stream: true,
    });

    // Streaming the response back to the client
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    // Return the stream as a response with appropriate headers
    return new NextResponse(stream, {
        headers: { 'Content-Type': 'text/event-stream' },
    });
}
