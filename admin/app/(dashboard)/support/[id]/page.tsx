import SupportChatClient from './support-chat-client';

export default async function SupportConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupportChatClient id={id} />;
}
