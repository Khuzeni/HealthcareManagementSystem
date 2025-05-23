import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import MessageList from '../components/messages/MessageList';
import ComposeMessage from '../components/messages/ComposeMessage';
import ViewMessage from '../components/messages/ViewMessage';
import { useAuth } from '../context/AuthContext';
import { supabase, subscribeToMessages } from '../lib/supabase';
import type { Message } from '../types';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to real-time updates
    const subscription = subscribeToMessages(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages((prev) => [payload.new, ...prev]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleSendMessage = async (subject: string, content: string, recipientId: string) => {
    if (!user) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: recipientId,
      subject,
      content,
    });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setIsComposing(false);
    }
  };

  const handleMessageClick = async (message: Message) => {
    // Mark message as read if the current user is the receiver
    if (message.receiverId === user?.id && !message.read) {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', message.id);

      if (error) {
        console.error('Error marking message as read:', error);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, read: true } : msg
          )
        );
      }
    }
    setSelectedMessage(message);
  };

  const handleReply = async (content: string) => {
    if (!selectedMessage || !user) return;

    await handleSendMessage(
      `Re: ${selectedMessage.subject}`,
      content,
      selectedMessage.senderId
    );
    setSelectedMessage(null);
  };

  const filteredMessages = messages.filter((message) =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
              </div>
              {!selectedMessage && (
                <Button
                  onClick={() => setIsComposing(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  New Message
                </Button>
              )}
            </div>

            {isComposing ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Compose Message</h2>
                <ComposeMessage
                  onSend={handleSendMessage}
                  onCancel={() => setIsComposing(false)}
                />
              </div>
            ) : selectedMessage ? (
              <ViewMessage
                message={selectedMessage}
                onBack={() => setSelectedMessage(null)}
                onReply={handleReply}
              />
            ) : (
              <>
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {filteredMessages.length > 0 ? (
                    <MessageList
                      messages={filteredMessages}
                      onMessageClick={handleMessageClick}
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by sending a new message.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MessagesPage;