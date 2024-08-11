import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
Customer Support Bot for HeadstarterAI

Welcome to HeadstarterAI's Customer Support! How can I assist you today?

Please provide a detailed description of the issue you are facing or the question you have. Our team of experts is here to help you with any inquiries related to the platform, AI-powered interviews, software engineering jobs, or any other concerns you may have.

Feel free to ask about technical issues, interview preparation, job search tips, or any other topic related to software engineering and AI-powered interviews.

We strive to provide prompt and accurate assistance to ensure a smooth experience for all our users.

Thank you for choosing HeadstartAI!

Best regards,
HeadstartAI Customer Support
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
