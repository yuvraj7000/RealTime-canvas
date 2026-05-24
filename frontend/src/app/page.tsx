"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createId } from "@/utils/id";
import Image from "next/image";
import shapes from "@/../public/shapes.png";

export default function Home() {
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomId = createId();
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={shapes}
            alt=""
            fill
            priority
            className=""
          />
        </div>
        <div className="absolute -left-24 top-16 h-105 w-105 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.28),transparent_60%)] blur-2xl" />
        <div className="absolute -right-32 bottom-10 h-95 w-95 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.25),transparent_60%)] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),rgba(255,255,255,0.2),transparent_70%)]" />
      </div>

      <main className="flex w-full max-w-4xl flex-col gap-10 px-6 py-24 text-center animate-[rise_700ms_ease-out]">
        <div className="flex flex-col gap-5">
          <span className="text-xs uppercase tracking-[0.3em] text-(--muted)">
            Canvas Bord
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            A realtime whiteboard UI, tuned for speed and flow.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-(--muted) sm:text-lg">
            Sketch, plan, and collaborate with an infinite canvas, precise tools,
            and instant room sharing. Backend sync lands next.
          </p>
        </div>

        <div className="mx-auto flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={handleCreateRoom}
            className="h-12 rounded-full bg-foreground px-8 text-background shadow-lg shadow-black/15 transition hover:opacity-90"
          >
            Create a room
          </Button>
        </div>
      </main>
    </div>
  );
}
