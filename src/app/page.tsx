'use client';

import { useEffect, useState } from 'react';
import { Session, type MultisynqSession } from '@multisynq/client';
import { ChatModel } from '@/lib/ChatModel';
import { ChatViewComponent } from '@/components/ChatView';
import { MULTISYNQ_CONFIG } from '@/config/multisynq';

export default function Home() {
  const [session, setSession] = useState<MultisynqSession<any> | null>(null);
  const [model, setModel] = useState<ChatModel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const connectToSession = async () => {
      try {
        const sessionResult = await Session.join({
          apiKey: MULTISYNQ_CONFIG.apiKey,
          appId: MULTISYNQ_CONFIG.appId,
          name: MULTISYNQ_CONFIG.name,
          password: MULTISYNQ_CONFIG.password,
          model: ChatModel
        });
        setSession(sessionResult);
        const rootModel = sessionResult.view.wellKnownModel("modelRoot") as ChatModel;
        setModel(rootModel);
        setIsConnected(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to session');
        console.error('Connection error:', err);
      }
    };

    connectToSession();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !model) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-lg text-gray-700">Connecting to Multisynq Chat...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ChatViewComponent model={model} session={session} />
    </div>
  );
}
