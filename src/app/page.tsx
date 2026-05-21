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
        <div className="min-h-screen bg-[#0f0f0f] text-gray-300 font-sans py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Problem List</h1>
                    <p className="text-gray-400">Select a problem to start coding.</p>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-gray-600 border-t-green-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#2d2d2d] border-b border-[#333]">
                                    <th className="py-4 px-6 text-xs uppercase font-semibold text-gray-500 tracking-wider">Status</th>
                                    <th className="py-4 px-6 text-xs uppercase font-semibold text-gray-500 tracking-wider">Title</th>
                                    <th className="py-4 px-6 text-xs uppercase font-semibold text-gray-500 tracking-wider">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {problems.map((problem) => (
                                    <tr key={problem.id} className="border-b border-[#333] hover:bg-[#252526] transition-colors">
                                        <td className="py-4 px-6 w-16">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex items-center justify-center">
                                                {/* You can implement 'solved' status logic here later */}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <Link href={`/problems/${problem.id}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium text-lg">
                                                {problem.id}. {problem.title}
                                            </Link>
                                        </td>
                                        <td className="py-4 px-6 w-32">
                                            {/* Hardcoded difficulty for aesthetics, can be added to DB later */}
                                            <span className="text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs font-semibold">
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
        </div>
    );
}
