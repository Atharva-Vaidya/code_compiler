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
    const [allProblems, setAllProblems] = useState<any[]>([]);
    const [testcases, setTestcases] = useState<any[]>([]);
    
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
    const [code, setCode] = useState("");
    
    const [customInput, setCustomInput] = useState("");
    const [output, setOutput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    const [verdict, setVerdict] = useState<any>(null);

    useEffect(() => {
        if (!problemId) return;

        async function fetchData() {
            // Fetch all problems for navbar
            const { data: allP } = await supabase.from("problems").select("id, title").order("id", { ascending: true });
            if (allP) setAllProblems(allP);

            const { data: pData } = await supabase.from("problems").select("*").eq("id", problemId).single();
            if (pData) {
                setProblem(pData);
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
        fetchData();
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

    if (!problem) return (
        <div className="flex h-screen bg-[#0f0f11] items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[#0f0f11] text-gray-300 font-sans">
            {/* Top Navbar */}
            <nav className="h-14 bg-[#18181b] border-b border-[#27272a] flex items-center px-6 shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-2 mr-8">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg tracking-wide hover:text-gray-300 transition-colors">Code Compiler</span>
                    </Link>
                </div>
                <div className="flex gap-6 text-sm overflow-x-auto">
                    {allProblems.map(p => (
                        <Link 
                            key={p.id} 
                            href={`/problems/${p.id}`} 
                            className={`whitespace-nowrap px-3 py-1 rounded-md transition-colors ${
                                p.id.toString() === problemId 
                                ? "bg-[#27272a] text-white font-medium" 
                                : "text-gray-400 hover:text-white"
                            }`}
                        >
                            {p.title}
                        </Link>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="bg-[#27272a] px-2 py-1 rounded text-gray-400 border border-[#3f3f46]">Ctrl</span>
                        <span className="bg-[#27272a] px-2 py-1 rounded text-gray-400 border border-[#3f3f46]">+</span>
                        <span className="bg-[#27272a] px-2 py-1 rounded text-gray-400 border border-[#3f3f46]">&crarr;</span>
                        <span className="ml-1">Run</span>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Problem Statement */}
                <div className="w-[45%] flex flex-col border-r border-[#27272a] overflow-y-auto bg-[#18181b]">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1 h-4 bg-yellow-500 rounded-full"></div>
                            <h1 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Problem</h1>
                        </div>
                        
                        <h2 className="text-xl font-bold text-gray-100 mb-6">{problem.id}. {problem.title}</h2>
                        
                        <div className="prose prose-invert max-w-none text-sm text-gray-400 leading-relaxed">
                            <ReactMarkdown 
                                components={{
                                    p: ({node, ...props}) => <p className="mb-4 text-gray-400" {...props} />,
                                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-200" {...props} />,
                                    code: ({node, inline, ...props}: any) => inline 
                                        ? <code className="bg-[#27272a] px-1.5 py-0.5 rounded text-blue-300 font-mono text-[13px]" {...props} /> 
                                        : <code {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                                    li: ({node, ...props}) => <li className="text-gray-400" {...props} />
                                }}
                            >
                                {problem.description ? problem.description.replace(/\\n/g, '\n') : ''}
                            </ReactMarkdown>
                        </div>
                        
                        <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mt-10 mb-4">Examples</h3>
                        
                        {testcases.map((tc, idx) => (
                            <div key={tc.id} className="mb-6 bg-[#202024] rounded-lg border border-[#27272a] overflow-hidden">
                                <div className="bg-[#27272a] px-4 py-2 border-b border-[#3f3f46]">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Example {idx + 1}</span>
                                </div>
                                <div className="p-4 font-mono text-[13px] text-gray-300">
                                    <p className="mb-2"><span className="text-gray-500">Input:</span> {tc.input ? tc.input.replace(/\\n/g, '\n') : ''}</p>
                                    <p><span className="text-gray-500">Output:</span> <span className="text-green-400">{tc.expected_output ? tc.expected_output.replace(/\\n/g, '\n') : ''}</span></p>
                                </div>
                            </div>
                        ))}

                        <h3 className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mt-8 mb-4">Constraints</h3>
                        <div className="bg-[#202024] p-5 rounded-lg border border-[#27272a] font-mono text-[13px] text-gray-300">
                            {problem.constraints ? problem.constraints.replace(/\\n/g, '\n').split('\n').map((line: string, i: number) => (
                                <p key={i} className="mb-2 flex gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>{line}</span>
                                </p>
                            )) : ''}
                        </div>
                    </div>
                    <div className="mt-auto border-t border-[#27272a] p-4 text-center text-xs text-gray-600 bg-[#121214]">
                        Test Build by Atharva and Shashank
                    </div>
                </div>

                {/* Right Panel: Editor and Output */}
                <div className="w-[55%] flex flex-col bg-[#0f0f11]">
                    {/* Editor Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#18181b] border-b border-[#27272a]">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Editor</span>
                            
                            <select
                                value={selectedLanguage.name}
                                onChange={handleLanguageChange}
                                className="bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] text-gray-300 text-xs rounded px-3 py-1 outline-none transition-colors ml-2 cursor-pointer font-medium"
                            >
                                {LANGUAGES.map(lang => (
                                    <option key={lang.name} value={lang.name}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleRunCode} disabled={isLoading} className="px-4 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] text-gray-300 hover:text-white text-xs font-medium rounded transition-colors disabled:opacity-50 border border-[#3f3f46]">
                                Run Code
                            </button>
                            <button onClick={handleSubmit} disabled={isLoading} className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20">
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
                            options={{ 
                                minimap: { enabled: false }, 
                                fontSize: 14, 
                                padding: { top: 16 },
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                scrollBeyondLastLine: false,
                                lineNumbersMinChars: 3,
                            }}
                            className="bg-[#0f0f11]"
                        />
                    </div>

                    {/* Bottom Panel: Terminal Input / Output */}
                    <div className="h-72 flex flex-col bg-[#18181b] border-t border-[#27272a]">
                        <div className="flex items-center px-4 py-2 border-b border-[#27272a] bg-[#121214]">
                            {/* Mac Window Controls */}
                            <div className="flex gap-1.5 mr-6">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase mr-4">Console</span>
                            
                            {verdict && (
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${verdict.verdict === 'Accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {verdict.verdict}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-[45%] p-4 border-r border-[#27272a] flex flex-col bg-[#0a0a0c]">
                                <label className="text-[10px] text-gray-600 mb-2 uppercase tracking-widest font-bold">STDIN</label>
                                <textarea
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    className="flex-1 bg-transparent text-gray-400 outline-none resize-none font-mono text-[13px]"
                                    spellCheck={false}
                                    placeholder="Enter custom input here..."
                                />
                            </div>
                            <div className="w-[55%] p-4 flex flex-col overflow-auto bg-[#0a0a0c]">
                                <label className="text-[10px] text-gray-600 mb-2 uppercase tracking-widest font-bold">STDOUT / RESULT</label>
                                {verdict ? (
                                    <div className="font-mono text-[13px] text-gray-300">
                                        <p className="text-blue-500 mb-4 opacity-80">forge@judge0:~$ ./solution</p>
                                        <p className="text-gray-400 mb-4">Passed {verdict.passed} / {verdict.total} testcases.</p>
                                        
                                        {verdict.details && verdict.details.length > 0 && (
                                            <div className="bg-[#18181b] p-4 rounded border border-[#27272a] text-red-400">
                                                {verdict.details[0].error ? verdict.details[0].error : (
                                                    <>
                                                        <p className="mb-2"><span className="text-gray-500">Input:</span><br/>{verdict.details[0].input ? verdict.details[0].input.replace(/\\n/g, '\n') : ''}</p>
                                                        <p className="mb-2"><span className="text-gray-500">Expected:</span><br/>{verdict.details[0].expected ? verdict.details[0].expected.replace(/\\n/g, '\n') : ''}</p>
                                                        <p><span className="text-gray-500">Actual:</span><br/>{verdict.details[0].actual ? verdict.details[0].actual.replace(/\\n/g, '\n') : ''}</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        
                                        {verdict.verdict === 'Accepted' && (
                                            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                                                <span>Status: <span className="text-green-400">Accepted</span></span>
                                                <span>Runtime: <span className="text-gray-300">{verdict.runtime}</span></span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex-1 font-mono text-[13px] text-gray-300 whitespace-pre-wrap">
                                        {output && <p className="text-blue-500 mb-4 opacity-80">forge@judge0:~$ ./solution</p>}
                                        <span className={output.includes('Error') ? 'text-red-400' : 'text-gray-400'}>
                                            {output || 'Run your code to see output here...'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
