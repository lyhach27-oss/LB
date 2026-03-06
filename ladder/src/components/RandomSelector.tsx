"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Copy, Plus, X, Play, RefreshCw, Trash2 } from "lucide-react";

export default function RandomSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // State
    const [inputText, setInputText] = useState("");
    const [items, setItems] = useState<string[]>([]);
    const [winner, setWinner] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentSlot, setCurrentSlot] = useState<string>("?");
    const [copySuccess, setCopySuccess] = useState(false);

    // Initialize from URL
    useEffect(() => {
        const namesParam = searchParams.get("names");
        if (namesParam) {
            const parsed = namesParam
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean);

            setItems(parsed);
            setInputText(parsed.join("\n"));
        }
    }, [searchParams]);

    // Update items based on textarea input
    useEffect(() => {
        const newItems = inputText
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

        // Only update if they differ to avoid infinite loops
        if (JSON.stringify(newItems) !== JSON.stringify(items)) {
            setItems(newItems);
            updateUrlParams(newItems);
        }
    }, [inputText]);

    const updateUrlParams = (newItems: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newItems.length > 0) {
            params.set("names", newItems.join(","));
        } else {
            params.delete("names");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const drawWinner = () => {
        if (items.length === 0 || isDrawing) return;

        setWinner(null);
        setIsDrawing(true);

        const duration = 2000; // 2 seconds spin
        const interval = 50; // Update slot 50ms
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * items.length);
            setCurrentSlot(items[randomIndex]);
            currentStep++;

            if (currentStep >= steps) {
                clearInterval(timer);
                const finalWinnerIndex = Math.floor(Math.random() * items.length);
                const finalWinner = items[finalWinnerIndex];

                setWinner(finalWinner);
                setCurrentSlot(finalWinner);
                setIsDrawing(false);
                triggerConfetti();
            }
        }, interval);
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#2563eb", "#3b82f6", "#ffffff", "#f59e0b", "#ef4444"],
        });
    };

    const removeWinner = () => {
        if (!winner) return;
        const newItems = items.filter((item) => item !== winner);
        setInputText(newItems.join("\n"));
        setWinner(null);
        setCurrentSlot("?");
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    const clearAll = () => {
        setInputText("");
        setWinner(null);
        setCurrentSlot("?");
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
            {/* Input Section */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-card glass shadow-xl rounded-2xl p-6 border border-border">
                    <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                        참가자 목록
                        <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                            {items.length} 명
                        </span>
                    </h2>

                    <textarea
                        className="w-full h-64 p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all"
                        placeholder="이름이나 항목을 줄바꿈(Enter)이나 쉼표(,)로 구분해서 입력하세요..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={copyShareLink}
                            className="flex-1 flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary text-foreground py-2 px-4 rounded-xl border border-border transition-colors text-sm font-medium"
                        >
                            {copySuccess ? <span className="text-green-500 flex items-center gap-1">복사 완료!</span> : <><Copy size={16} /> 링크 복사하기</>}
                        </button>
                        <button
                            onClick={clearAll}
                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl border border-border transition-colors"
                            title="모두 지우기"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Action Section */}
            <div className="w-full md:w-2/3 flex flex-col items-center justify-center min-h-[400px]">
                {/* The Display Box */}
                <div className="relative w-full max-w-md aspect-video bg-card glass shadow-2xl rounded-3xl border border-border flex items-center justify-center overflow-hidden mb-8">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={currentSlot}
                            initial={{ y: 50, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: winner ? 1.2 : 1 }}
                            exit={{ y: -50, opacity: 0, scale: 0.8 }}
                            transition={{
                                type: "spring",
                                stiffness: isDrawing ? 400 : 200,
                                damping: isDrawing ? 30 : 15
                            }}
                            className={`text-4xl md:text-6xl font-black text-center px-4 ${winner ? "text-primary" : "text-foreground"}`}
                        >
                            {currentSlot}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 w-full max-w-md">
                    <button
                        onClick={drawWinner}
                        disabled={items.length === 0 || isDrawing}
                        className={`w-full py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${items.length === 0 || isDrawing
                            ? "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-blue-700 shadow-lg hover:shadow-primary/25"
                            }`}
                    >
                        {isDrawing ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <RefreshCw size={24} />
                            </motion.div>
                        ) : (
                            <><Play size={24} fill="currentColor" /> 추첨하기</>
                        )}
                    </button>

                    <AnimatePresence>
                        {winner && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <button
                                    onClick={removeWinner}
                                    className="w-full py-3 rounded-xl border-2 border-primary/20 hover:border-primary/50 text-foreground font-medium flex items-center justify-center gap-2 transition-colors bg-card"
                                >
                                    <X size={18} /> 뽑힌 사람 제외하고 진행
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
