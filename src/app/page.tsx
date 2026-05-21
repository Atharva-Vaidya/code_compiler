"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
    const [problems, setProblems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProblems() {
            const { data, error } = await supabase
                .from("problems")
                .select("id, title")
                .order("id", { ascending: true });
            
            if (error) {
                console.error("Error fetching problems:", error);
            }
            if (data) {
                setProblems(data);
            }
            setIsLoading(false);
        }
        fetchProblems();
    }, []);

    return (
        <div className="min-h-screen bg-[#0f0f11] text-gray-300 font-sans flex flex-col">
            {/* Top Navbar */}
            <nav className="h-14 bg-[#18181b] border-b border-[#27272a] flex items-center px-6 shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-2 mr-8">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg tracking-wide hover:text-gray-300 transition-colors">Code Compiler</span>
                    </Link>
                </div>
                <div className="flex gap-6 text-sm overflow-x-auto">
                    {problems.slice(0,3).map(p => (
                        <Link 
                            key={p.id} 
                            href={`/problems/${p.id}`} 
                            className="whitespace-nowrap px-3 py-1 rounded-md transition-colors text-gray-400 hover:text-white"
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

            <div className="flex-1 max-w-5xl mx-auto w-full py-16 px-6">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
                    <h1 className="text-3xl font-bold text-white tracking-tight uppercase tracking-widest text-sm">Problem List</h1>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-gray-600 border-t-yellow-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="bg-[#18181b] border border-[#27272a] rounded-lg shadow-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#202024] border-b border-[#27272a]">
                                    <th className="py-4 px-6 text-xs uppercase font-bold text-gray-500 tracking-widest">Status</th>
                                    <th className="py-4 px-6 text-xs uppercase font-bold text-gray-500 tracking-widest">Title</th>
                                    <th className="py-4 px-6 text-xs uppercase font-bold text-gray-500 tracking-widest">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {problems.map((problem) => (
                                    <tr key={problem.id} className="border-b border-[#27272a] hover:bg-[#202024] transition-colors group">
                                        <td className="py-4 px-6 w-16">
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-600 group-hover:border-yellow-500 transition-colors"></div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Link href={`/problems/${problem.id}`} className="text-gray-300 hover:text-white font-medium text-lg flex items-center gap-3">
                                                <span>{problem.id}.</span> <span>{problem.title}</span>
                                            </Link>
                                        </td>
                                        <td className="py-4 px-6 w-32">
                                            <span className="text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/20">
                                                Easy
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {problems.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-12 text-center text-gray-500">
                                            No problems available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-8 text-center text-xs text-gray-600 border-t border-[#27272a] bg-[#121214]">
                Test Build by Atharva and Shashank
            </footer>
        </div>
    );
}
