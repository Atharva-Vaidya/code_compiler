import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { code, input, language_id } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: 'Code is required' },
                { status: 400 }
            );
        }

        const judge0Response = await fetch(
            'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language_id || 71, // fallback to Python
                    stdin: input || '',
                }),
            }
        );

        const data = await judge0Response.json();

        if (!judge0Response.ok) {
            console.error('Judge0 API Error:', data);
            return NextResponse.json(
                { error: 'Failed to execute code on Judge0', details: data },
                { status: judge0Response.status }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Code execution error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
