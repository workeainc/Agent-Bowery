'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppShell from '@/components/layout/AppShell';
import AutoReplyConfig from '@/components/inbox/AutoReplyConfig';
import LeadExtraction from '@/components/inbox/LeadExtraction';
import { apiClient } from '@/lib/api-client';
import { ContentManager } from '@/components/auth/RoleGuard';

interface Message {
  id: string;
  platform: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  content: string;
  timestamp: Date;
  status: 'unread' | 'read' | 'replied' | 'archived';
  conversationId: string;
  isIncoming: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  isLead?: boolean;
  leadScore?: number;
}

interface Conversation {
  id: string;
  platform: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  }>;
  lastMessage: Message;
  unreadCount: number;
  status: 'active' | 'archived' | 'spam';
  isLead: boolean;
  leadScore?: number;
  tags: string[];
}

export default function InboxPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'leads' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'auto-reply' | 'leads'>('inbox');

  // Mock data for demonstration
  const mockConversations: Conversation[] = [
    {
      id: '1',
      platform: 'FACEBOOK',
      participants: [
        { id: 'user1', name: 'John Smith', avatar: '👤', username: '@johnsmith' }
      ],
      lastMessage: {
        id: 'msg1',
        platform: 'FACEBOOK',
        sender: { id: 'user1', name: 'John Smith', avatar: '👤', username: '@johnsmith' },
        content: 'Hi! I\'m interested in your services. Can you tell me more about pricing?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'unread',
        conversationId: '1',
        isIncoming: true,
        sentiment: 'positive',
        sentimentScore: 0.8,
        isLead: true,
        leadScore: 85
      },
      unreadCount: 2,
      status: 'active',
      isLead: true,
      leadScore: 85,
      tags: ['pricing', 'inquiry']
    },
    {
      id: '2',
      platform: 'LINKEDIN',
      participants: [
        { id: 'user2', name: 'Sarah Johnson', avatar: '👩', username: '@sarahj' }
      ],
      lastMessage: {
        id: 'msg2',
        platform: 'LINKEDIN',
        sender: { id: 'user2', name: 'Sarah Johnson', avatar: '👩', username: '@sarahj' },
        content: 'Thanks for the article! Very insightful content.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        status: 'read',
        conversationId: '2',
        isIncoming: true,
        sentiment: 'positive',
        sentimentScore: 0.9
      },
      unreadCount: 0,
      status: 'active',
      isLead: false,
      tags: ['feedback']
    },
    {
      id: '3',
      platform: 'INSTAGRAM',
      participants: [
        { id: 'user3', name: 'Mike Wilson', avatar: '👨', username: '@mikew' }
      ],
      lastMessage: {
        id: 'msg3',
        platform: 'INSTAGRAM',
        sender: { id: 'user3', name: 'Mike Wilson', avatar: '👨', username: '@mikew' },
        content: 'When will you have new products available?',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        status: 'unread',
        conversationId: '3',
        isIncoming: true,
        sentiment: 'neutral',
        sentimentScore: 0.5,
        isLead: true,
        leadScore: 70
      },
      unreadCount: 1,
      status: 'active',
      isLead: true,
      leadScore: 70,
      tags: ['products', 'inquiry']
    }
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg1',
      platform: 'FACEBOOK',
      sender: { id: 'user1', name: 'John Smith', avatar: '👤', username: '@johnsmith' },
      content: 'Hi! I\'m interested in your services. Can you tell me more about pricing?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'unread',
      conversationId: '1',
      isIncoming: true,
      sentiment: 'positive',
      sentimentScore: 0.8,
      isLead: true,
      leadScore: 85
    },
    {
      id: 'msg2',
      platform: 'FACEBOOK',
      sender: { id: 'current_user', name: 'Agent Bowery', avatar: '🤖' },
      content: 'Hello John! I\'d be happy to help you with pricing information. Let me send you our latest pricing sheet.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'read',
      conversationId: '1',
      isIncoming: false
    },
    {
      id: 'msg3',
      platform: 'FACEBOOK',
      sender: { id: 'user1', name: 'John Smith', avatar: '👤', username: '@johnsmith' },
      content: 'Perfect! What are your payment terms?',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'unread',
      conversationId: '1',
      isIncoming: true,
      sentiment: 'positive',
      sentimentScore: 0.7,
      isLead: true,
      leadScore: 85
    }
  ];

  useEffect(() => {
    // Set mock data for demo
    setConversations(mockConversations);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // In a real app, this would fetch messages for the selected conversation
      setMessages(mockMessages.filter(msg => msg.conversationId === selectedConversation.id));
    }
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      platform: selectedConversation.platform,
      sender: { id: 'current_user', name: 'Agent Bowery', avatar: '🤖' },
      content: newMessage,
      timestamp: new Date(),
      status: 'read',
      conversationId: selectedConversation.id,
      isIncoming: false
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // In a real app, this would send the message via API
    console.log('Sending message:', message);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark messages as read
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return '📘';
      case 'LINKEDIN': return '💼';
      case 'INSTAGRAM': return '📷';
      case 'TWITTER': return '🐦';
      case 'EMAIL': return '📧';
      default: return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK': return 'text-blue-600';
      case 'LINKEDIN': return 'text-blue-700';
      case 'INSTAGRAM': return 'text-pink-600';
      case 'TWITTER': return 'text-blue-400';
      case 'EMAIL': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '❓';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (activeFilter === 'unread' && conv.unreadCount === 0) return false;
    if (activeFilter === 'leads' && !conv.isLead) return false;
    if (activeFilter === 'archived' && conv.status !== 'archived') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return conv.participants.some(p => 
        p.name.toLowerCase().includes(query) || 
        p.username?.toLowerCase().includes(query)
      ) || conv.lastMessage.content.toLowerCase().includes(query);
    }
    
    return true;
  });

  if (loading) {
    return (
      <ContentManager fallback={
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to view the inbox.</p>
            </div>
          </div>
        </AppShell>
      }>
        <AppShell>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading inbox...</p>
            </div>
          </div>
        </AppShell>
      </ContentManager>
    );
  }

  return (
    <ContentManager fallback={
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view the inbox.</p>
          </div>
        </div>
      </AppShell>
    }>
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Inbox</h1>
              <p className="text-gray-600 mt-2">
                Manage messages and conversations across all platforms
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {conversations.filter(c => c.unreadCount > 0).length} unread conversations
              </div>
              <button className="btn-primary">
                Compose Message
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 flex flex-col">
              {/* Search and Filters */}
              <div className="p-4 border-b border-gray-200">
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input w-full"
                    placeholder="Search conversations..."
                  />
                </div>
                
                <div className="flex space-x-2">
                  {[
                    { key: 'all', label: 'All', count: conversations.length },
                    { key: 'unread', label: 'Unread', count: conversations.filter(c => c.unreadCount > 0).length },
                    { key: 'leads', label: 'Leads', count: conversations.filter(c => c.isLead).length },
                    { key: 'archived', label: 'Archived', count: conversations.filter(c => c.status === 'archived').length }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key as any)}
                      className={`px-3 py-1 text-sm font-medium rounded ${
                        activeFilter === filter.key
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                          {conversation.participants[0]?.avatar || '👤'}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.participants[0]?.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg ${getPlatformColor(conversation.platform)}`}>
                              {getPlatformIcon(conversation.platform)}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {conversation.lastMessage.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {conversation.lastMessage.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            {conversation.isLead && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Lead ({conversation.leadScore}%)
                              </span>
                            )}
                            {conversation.lastMessage.sentiment && (
                              <span className={`text-sm ${getSentimentColor(conversation.lastMessage.sentiment)}`}>
                                {getSentimentIcon(conversation.lastMessage.sentiment)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 text-4xl mb-2">📭</div>
                    <p className="text-gray-500">No conversations found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                          {selectedConversation.participants[0]?.avatar || '👤'}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {selectedConversation.participants[0]?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedConversation.participants[0]?.username}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`text-2xl ${getPlatformColor(selectedConversation.platform)}`}>
                          {getPlatformIcon(selectedConversation.platform)}
                        </span>
                        {selectedConversation.isLead && (
                          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                            Lead ({selectedConversation.leadScore}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isIncoming 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-primary-500 text-white'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${
                              message.isIncoming ? 'text-gray-500' : 'text-primary-100'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.sentiment && (
                              <span className={`text-sm ${getSentimentColor(message.sentiment)}`}>
                                {getSentimentIcon(message.sentiment)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="input flex-1"
                        placeholder="Type your message..."
                      />
                      <button
                        onClick={handleSendMessage}
                        className="btn-primary"
                        disabled={!newMessage.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">💬</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ContentManager>
  );
}
