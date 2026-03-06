import React, { Suspense } from "react";
import RandomSelector from "@/components/RandomSelector";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-background selection:bg-primary selection:text-primary-foreground text-foreground transition-colors duration-300">
      <main className="w-full flex-grow flex flex-col items-center justify-center">

        {/* Header Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 ring-1 ring-primary/20 backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">뭐할까?</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto opacity-80">
            당번을 정하거나, 점심 메뉴를 고르거나, 발표자를 빠르고 공정하게 뽑아보세요.
          </p>
        </div>

        {/* Main Application Area */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
          <Suspense fallback={
            <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4" />
                <p className="text-muted-foreground">선택기 로딩 중...</p>
              </div>
            </div>
          }>
            <RandomSelector />
          </Suspense>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground opacity-60 flex flex-col items-center gap-2">
        <p>Built with Next.js & Tailwind CSS.</p>
        <p>팀 빌딩, 회식 메뉴 선정, 데일리 스탠드업에 유용하게 쓸 수 있습니다.</p>
      </footer>
    </div>
  );
}
