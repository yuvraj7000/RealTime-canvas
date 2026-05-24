import { WhiteboardShell } from "@/components/whiteboard/WhiteboardShell";

type RoomPageProps = {
  params: {
    roomId: string;
  };
};

export default async function RoomPage({ params }: RoomPageProps) {
  const resolved = await params;

  return <WhiteboardShell roomId={resolved.roomId} />;
}
