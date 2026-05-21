import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { code, input, language_id, problemId } = await request.json();

        if (!code || !problemId || !language_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch testcases for the problem
        const { data: testcases, error: testcaseError } = await supabase
            .from('testcases')
            .select('*')
            .eq('problem_id', problemId);

        if (testcaseError || !testcases || testcases.length === 0) {
            return NextResponse.json({ error: 'Testcases not found' }, { status: 404 });
        }

        let passedCount = 0;
        let finalVerdict = 'Accepted';
        let maxRuntime = 0;
        let executionDetails = [];

        // Evaluate against each testcase
        for (const testcase of testcases) {
            const judge0Response = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_code: code,
                    language_id: language_id,
                    stdin: testcase.input.replace(/\\n/g, '\n')
                }),
            });

            const data = await judge0Response.json();

            if (!judge0Response.ok) {
                finalVerdict = 'Runtime Error';
                break;
            }

            // Check compilation error
            if (data.compile_output) {
                finalVerdict = 'Compilation Error';
                executionDetails.push({ error: data.compile_output });
                break;
            }

            // Check runtime error
            if (data.stderr || (data.status && data.status.id > 3)) {
                finalVerdict = data.status?.description || 'Runtime Error';
                executionDetails.push({ error: data.stderr || 'Runtime error' });
                break;
            }

            // Compare output
            const expected = testcase.expected_output.replace(/\\n/g, '\n').trim().replace(/\r\n/g, '\n');
            const actual = (data.stdout || '').trim().replace(/\r\n/g, '\n');

            if (actual !== expected) {
                finalVerdict = 'Wrong Answer';
                executionDetails.push({
                    input: testcase.is_public ? testcase.input : 'Hidden',
                    expected: testcase.is_public ? expected : 'Hidden',
                    actual: testcase.is_public ? actual : 'Hidden'
                });
                break;
            }

            passedCount++;
            maxRuntime = Math.max(maxRuntime, parseFloat(data.time || '0'));
        }

        // Save submission to Supabase
        const { error: insertError } = await supabase
            .from('submissions')
            .insert([{
                problem_id: problemId,
                code: code,
                language_id: language_id,
                verdict: finalVerdict,
                runtime: maxRuntime.toString() + 's'
            }]);

        if (insertError) {
            console.error('Failed to save submission:', insertError);
        }

        return NextResponse.json({
            verdict: finalVerdict,
            passed: passedCount,
            total: testcases.length,
            runtime: maxRuntime.toString() + 's',
            details: executionDetails
        });

    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
