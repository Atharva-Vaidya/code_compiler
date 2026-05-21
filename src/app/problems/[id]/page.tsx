"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const LANGUAGES = [
    { name: "Python", editorLanguage: "python", judge0Id: 71 },
    { name: "JavaScript", editorLanguage: "javascript", judge0Id: 63 },
    { name: "Java", editorLanguage: "java", judge0Id: 62 },
    { name: "C++", editorLanguage: "cpp", judge0Id: 54 },
    { name: "C", editorLanguage: "c", judge0Id: 50 }
];

export default function ProblemPage() {
    const params = useParams();
    const problemId = params.id as string;

    const [problem, setProblem] = useState<any>(null);
    const [testcases, setTestcases] = useState<any[]>([]);
    
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
    const [code, setCode] = useState("");
    
    const [customInput, setCustomInput] = useState("");
    const [output, setOutput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Verdict state
    const [verdict, setVerdict] = useState<any>(null);

    useEffect(() => {
        if (!problemId) return;

        async function fetchProblem() {
            const { data: pData } = await supabase.from("problems").select("*").eq("id", problemId).single();
            if (pData) {
                setProblem(pData);
                // Set initial code based on language
                const starterCode = pData.starter_code || {};
                setCode(starterCode[selectedLanguage.editorLanguage] || "");
            }

            const { data: tData } = await supabase.from("testcases").select("*").eq("problem_id", problemId).eq("is_public", true);
            if (tData) {
                setTestcases(tData);
                if (tData.length > 0) {
                    setCustomInput(tData[0].input.replace(/\\n/g, '\n'));
                }
            }
        }
        fetchProblem();
    }, [problemId]);

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = LANGUAGES.find(l => l.name === e.target.value) || LANGUAGES[0];
        setSelectedLanguage(lang);
        if (problem && problem.starter_code) {
            setCode(problem.starter_code[lang.editorLanguage] || "");
        }
    };

    const handleRunCode = async () => {
        setIsLoading(true);
        setOutput("Running Custom Input...");
        setVerdict(null);
        try {
            const response = await fetch("/api/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    input: customInput,
                    language_id: selectedLanguage.judge0Id
                }),
            });
            const data = await response.json();
            
            let resultText = "";
            if (data.compile_output) resultText += `Compilation Error:\n${data.compile_output}\n`;
            if (data.stderr) resultText += `Runtime Error:\n${data.stderr}\n`;
            if (data.stdout) resultText += `Output:\n${data.stdout}\n`;
            setOutput(resultText.trim() || "Executed without output");
        } catch (error) {
            setOutput("Failed to run code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setOutput("Submitting code to Judge0 for all testcases...");
        setVerdict(null);
        try {
            const response = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code,
                    problemId: parseInt(problemId),
                    language_id: selectedLanguage.judge0Id
                }),
            });
            const data = await response.json();
            setVerdict(data);
            setOutput(`Submission Completed! Verdict: ${data.verdict}`);
        } catch (error) {
            setOutput("Failed to submit code.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!problem) return <div className="p-8 text-white">Loading problem...</div>;

    return (
        <div className="flex h-screen bg-[#0f0f0f] text-gray-300 font-sans">
            {/* Left Panel: Problem Statement */}
            <div className="w-1/3 flex flex-col border-r border-[#333] overflow-y-auto">
                <div className="bg-[#1e1e1e] p-4 border-b border-[#333] flex items-center gap-4">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-[#333] rounded-md" title="Back to problems">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-white">{problem.id}. {problem.title}</h1>
                </div>
                <div className="p-6 flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                    <ReactMarkdown 
                        components={{
                            p: ({node, ...props}) => <p className="mb-4" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                            code: ({node, inline, ...props}: any) => inline 
                                ? <code className="bg-[#2d2d2d] px-1 py-0.5 rounded text-gray-200 font-mono text-xs" {...props} /> 
                                : <code {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />
                        }}
                    >
                        {problem.description ? problem.description.replace(/\\n/g, '\n') : ''}
                    </ReactMarkdown>
                    
                    <h3 className="text-lg font-semibold text-white mt-8 mb-2">Constraints:</h3>
                    <div className="bg-[#1e1e1e] p-4 rounded-md font-mono text-xs">
                        {problem.constraints ? problem.constraints.replace(/\\n/g, '\n') : ''}
                    </div>

                    {testcases.map((tc, idx) => (
                        <div key={tc.id} className="mt-6">
                            <h3 className="font-semibold text-white mb-2">Example {idx + 1}:</h3>
                            <div className="bg-[#1e1e1e] p-4 rounded-md font-mono text-xs mb-2">
                                <p><span className="text-gray-500">Input:</span><br/>{tc.input ? tc.input.replace(/\\n/g, '\n') : ''}</p>
                                <p className="mt-2"><span className="text-gray-500">Output:</span><br/>{tc.expected_output ? tc.expected_output.replace(/\\n/g, '\n') : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Editor and Output */}
            <div className="w-2/3 flex flex-col">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333]">
                    <select
                        value={selectedLanguage.name}
                        onChange={handleLanguageChange}
                        className="bg-[#2d2d2d] border border-[#555] text-white text-sm rounded-md px-3 py-1 outline-none"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.name} value={lang.name}>{lang.name}</option>
                        ))}
                    </select>
                    <div className="flex gap-3">
                        <button onClick={handleRunCode} disabled={isLoading} className="px-4 py-1.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
                            Run Custom Input
                        </button>
                        <button onClick={handleSubmit} disabled={isLoading} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2">
                            {isLoading ? 'Running...' : 'Submit'}
                        </button>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="flex-1">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={selectedLanguage.editorLanguage}
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
                    />
                </div>

                {/* Bottom Panel: Input / Output / Verdict */}
                <div className="h-64 flex flex-col bg-[#1e1e1e] border-t border-[#333]">
                    <div className="flex bg-[#2d2d2d] text-xs font-medium border-b border-[#333]">
                        <div className="px-4 py-2 border-r border-[#333] text-gray-300">Console</div>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-1/2 p-4 border-r border-[#333] flex flex-col">
                            <label className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Custom Input</label>
                            <textarea
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                className="flex-1 bg-[#1e1e1e] text-gray-300 outline-none resize-none font-mono text-sm"
                                spellCheck={false}
                            />
                        </div>
                        <div className="w-1/2 p-4 flex flex-col overflow-auto">
                            {verdict ? (
                                <div>
                                    <h2 className={`text-xl font-bold mb-2 ${verdict.verdict === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                        {verdict.verdict}
                                    </h2>
                                    <p className="text-sm text-gray-400 mb-4">Passed {verdict.passed} / {verdict.total} testcases.</p>
                                    {verdict.details && verdict.details.length > 0 && (
                                        <div className="bg-[#2d2d2d] p-3 rounded font-mono text-xs mt-2 overflow-x-auto text-red-400 whitespace-pre-wrap">
                                            {verdict.details[0].error ? verdict.details[0].error : (
                                                <>
                                                    <p className="mb-2"><span className="text-gray-400">Input:</span><br/>{verdict.details[0].input ? verdict.details[0].input.replace(/\\n/g, '\n') : ''}</p>
                                                    <p className="mb-2"><span className="text-gray-400">Expected:</span><br/>{verdict.details[0].expected ? verdict.details[0].expected.replace(/\\n/g, '\n') : ''}</p>
                                                    <p><span className="text-gray-400">Actual:</span><br/>{verdict.details[0].actual ? verdict.details[0].actual.replace(/\\n/g, '\n') : ''}</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <label className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Output</label>
                                    <pre className="flex-1 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                                        {output}
                                    </pre>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
