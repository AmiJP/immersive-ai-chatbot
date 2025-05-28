"use client";
import dynamic from "next/dynamic";

const Chatbot = dynamic(() => import("@/components/Chatbot"), { ssr: false });

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-8">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Welcome to ChatBot!</h1>
        <p className="text-lg text-muted-foreground max-w-lg text-center">
          This is a simple landing page. Click the chat button at the bottom right to start chatting with the bot.
        </p>
      </main>
      <Chatbot />
    </div>
  );
}
