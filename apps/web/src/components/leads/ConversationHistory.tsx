'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  leadId: string;
  platform: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing' | 'system';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
  metadata?: {
    messageId?: string;
    threadId?: string;
    replyTo?: string;
  };
}

interface Conversation {
  id: string;
  leadId: string;
  platform: string;
  subject?: string;
  status: 'active' | 'closed' | 'archived';
  participants: string[];
  lastMessage?: Message;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

interface ConversationHistoryProps {
  leadId: string;
  onConversationSelect?: (conversation: Conversation) => void;
}

export default function ConversationHistory({ leadId, onConversationSelect }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      leadId: leadId,
      platform: 'LinkedIn',
      subject: 'Initial inquiry about enterprise solution',
      status: 'active',
      participants: ['Alice Johnson', 'John Smith'],
      messageCount: 8,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      tags: ['inquiry', 'enterprise']
    },
    {
      id: 'conv-2',
      leadId: leadId,
      platform: 'Email',
      subject: 'Follow-up on pricing discussion',
      status: 'active',
      participants: ['Alice Johnson', 'Sarah Wilson'],
      messageCount: 5,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-21'),
      tags: ['pricing', 'follow-up']
    },
    {
      id: 'conv-3',
      leadId: leadId,
      platform: 'Phone',
      subject: 'Product demo call',
      status: 'closed',
      participants: ['Alice Johnson', 'Mike Johnson'],
      messageCount: 1,
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
      tags: ['demo', 'call']
    }
  ];

  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      leadId: leadId,
      platform: 'LinkedIn',
      sender: 'Alice Johnson',
      content: 'Hi John, I saw your post about the new enterprise features. We\'re interested in learning more about your solution.',
      timestamp: new Date('2024-01-15T10:00:00Z'),
      type: 'incoming',
      status: 'read'
    },
    {
      id: 'msg-2',
      leadId: leadId,
      platform: 'LinkedIn',
      sender: 'John Smith',
      content: 'Hi Alice! Thanks for reaching out. I\'d be happy to discuss our enterprise solution with you. What specific features are you most interested in?',
      timestamp: new Date('2024-01-15T10:15:00Z'),
      type: 'outgoing',
      status: 'read'
    },
    {
      id: 'msg-3',
      leadId: leadId,
      platform: 'LinkedIn',
      sender: 'Alice Johnson',
      content: 'We\'re particularly interested in the advanced analytics and team collaboration features. Do you have a demo available?',
      timestamp: new Date('2024-01-15T14:30:00Z'),
      type: 'incoming',
      status: 'read'
    },
    {
      id: 'msg-4',
      leadId: leadId,
      platform: 'LinkedIn',
      sender: 'John Smith',
      content: 'Absolutely! I can set up a personalized demo for you. What time works best for your team?',
      timestamp: new Date('2024-01-15T14:45:00Z'),
      type: 'outgoing',
      status: 'read'
    },
    {
      id: 'msg-5',
      leadId: leadId,
      platform: 'Email',
      sender: 'Alice Johnson',
      content: 'Hi Sarah, following up on our LinkedIn conversation. I\'d like to discuss pricing for the enterprise package.',
      timestamp: new Date('2024-01-18T09:00:00Z'),
      type: 'incoming',
      status: 'read'
    },
    {
      id: 'msg-6',
      leadId: leadId,
      platform: 'Email',
      sender: 'Sarah Wilson',
      content: 'Hi Alice, I\'ve attached our enterprise pricing sheet. The package includes all the features we discussed plus priority support.',
      timestamp: new Date('2024-01-18T11:30:00Z'),
      type: 'outgoing',
      status: 'read',
      attachments: [
        {
          id: 'att-1',
          name: 'Enterprise_Pricing_2024.pdf',
          type: 'application/pdf',
          url: '/documents/enterprise-pricing.pdf'
        }
      ]
    }
  ];

  useEffect(() => {
    // Set mock data for demo
    setConversations(mockConversations);
    setLoading(false);
  }, [leadId]);

  useEffect(() => {
    if (selectedConversation) {
      // Filter messages for the selected conversation
      setMessages(mockMessages.filter(msg => msg.platform === selectedConversation.platform));
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      leadId: leadId,
      platform: selectedConversation.platform,
      sender: 'Current User', // Assuming current user is the sender
      content: newMessage,
      timestamp: new Date(),
      type: 'outgoing',
      status: 'sent'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Update conversation
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { 
            ...conv, 
            messageCount: conv.messageCount + 1,
            updatedAt: new Date(),
            lastMessage: message
          }
        : conv
    ));

    console.log('Sending message:', message);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (onConversationSelect) {
      onConversationSelect(conversation);
    }
  };

  const handleCreateConversation = (conversationData: Partial<Conversation>) => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      leadId: leadId,
      platform: conversationData.platform || 'Email',
      subject: conversationData.subject || '',
      status: 'active',
      participants: conversationData.participants || [],
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: conversationData.tags || []
    };

    setConversations(prev => [newConversation, ...prev]);
    setShowNewConversationModal(false);
    alert('Conversation created successfully!');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return '💼';
      case 'Email': return '📧';
      case 'Phone': return '📞';
      case 'Facebook': return '📘';
      case 'Twitter': return '🐦';
      case 'Instagram': return '📷';
      default: return '💬';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming': return '📥';
      case 'outgoing': return '📤';
      case 'system': return '⚙️';
      default: return '💬';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'archived': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Conversation History</h2>
          <p className="text-gray-600 mt-1">
            Track all communications with this lead
          </p>
        </div>
        <button
          onClick={() => setShowNewConversationModal(true)}
          className="btn-primary"
        >
          New Conversation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Conversations</h3>
            <p className="text-sm text-gray-600">{conversations.length} conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations found.
              </div>
            ) : (
              <ul>
                {conversations.map(conversation => (
                  <li
                    key={conversation.id}
                    className={`flex items-start p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.id === conversation.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex-shrink-0 mr-3 text-xl">
                      {getPlatformIcon(conversation.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {conversation.platform}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                      </div>
                      {conversation.subject && (
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conversation.subject}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{conversation.messageCount} messages</span>
                        <span>{formatDate(conversation.updatedAt)}</span>
                      </div>
                      {conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conversation.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Message Pane */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3 text-2xl">
                    {getPlatformIcon(selectedConversation.platform)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.platform} Conversation
                    </h2>
                    {selectedConversation.subject && (
                      <p className="text-sm text-gray-600">{selectedConversation.subject}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedConversation.status)}`}>
                    {selectedConversation.status}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No messages in this conversation.</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'incoming' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-lg p-3 rounded-lg shadow-sm ${
                          message.type === 'incoming' 
                            ? 'bg-gray-100 text-gray-800 rounded-bl-none' 
                            : 'bg-primary-500 text-white rounded-br-none'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm">{getMessageTypeIcon(message.type)}</span>
                          <span className="text-xs font-medium">{message.sender}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map(attachment => (
                              <div key={attachment.id} className="flex items-center space-x-2">
                                <span className="text-xs">📎</span>
                                <a
                                  href={attachment.url}
                                  className="text-xs underline hover:no-underline"
                                >
                                  {attachment.name}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={`mt-1 text-xs ${
                          message.type === 'incoming' ? 'text-gray-500' : 'text-primary-100'
                        } flex justify-between items-center`}>
                          <span>{formatTime(message.timestamp)}</span>
                          <span className="text-xs">{message.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center space-x-3">
                <textarea
                  className="input flex-1 resize-none"
                  rows={1}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                ></textarea>
                <button
                  onClick={handleSendMessage}
                  className="btn-primary"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p>Select a conversation to view messages.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select className="input w-full">
                  <option value="Email">Email</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Phone">Phone</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Twitter">Twitter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Conversation subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateConversation({})}
                  className="btn-primary"
                >
                  Create Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
