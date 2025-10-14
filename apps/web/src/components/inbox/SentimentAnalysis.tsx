'use client';

import { useState, useEffect } from 'react';

interface SentimentData {
  id: string;
  message: string;
  platform: string;
  timestamp: Date;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
  };
  keywords: string[];
}

interface SentimentAnalysisProps {
  onSentimentChange?: (sentiment: SentimentData) => void;
}

export default function SentimentAnalysis({ onSentimentChange }: SentimentAnalysisProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [overallSentiment, setOverallSentiment] = useState<{
    positive: number;
    neutral: number;
    negative: number;
  }>({ positive: 0, neutral: 0, negative: 0 });

  // Mock data for demonstration
  const mockSentimentData: SentimentData[] = [
    {
      id: '1',
      message: 'Great product! Really happy with the service.',
      platform: 'FACEBOOK',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sentiment: 'positive',
      confidence: 0.92,
      emotions: {
        joy: 0.85,
        anger: 0.02,
        fear: 0.01,
        sadness: 0.01,
        surprise: 0.11
      },
      keywords: ['great', 'happy', 'service']
    },
    {
      id: '2',
      message: 'The pricing seems a bit high for what you get.',
      platform: 'LINKEDIN',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      sentiment: 'negative',
      confidence: 0.78,
      emotions: {
        joy: 0.05,
        anger: 0.15,
        fear: 0.08,
        sadness: 0.12,
        surprise: 0.60
      },
      keywords: ['pricing', 'high']
    },
    {
      id: '3',
      message: 'Can you tell me more about the features?',
      platform: 'INSTAGRAM',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sentiment: 'neutral',
      confidence: 0.65,
      emotions: {
        joy: 0.20,
        anger: 0.05,
        fear: 0.10,
        sadness: 0.05,
        surprise: 0.60
      },
      keywords: ['features', 'tell', 'more']
    },
    {
      id: '4',
      message: 'Amazing support team! They helped me solve my issue quickly.',
      platform: 'TWITTER',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      sentiment: 'positive',
      confidence: 0.88,
      emotions: {
        joy: 0.75,
        anger: 0.01,
        fear: 0.02,
        sadness: 0.01,
        surprise: 0.21
      },
      keywords: ['amazing', 'support', 'helped', 'quickly']
    },
    {
      id: '5',
      message: 'I\'m not sure if this is the right solution for me.',
      platform: 'EMAIL',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      sentiment: 'negative',
      confidence: 0.72,
      emotions: {
        joy: 0.08,
        anger: 0.12,
        fear: 0.35,
        sadness: 0.25,
        surprise: 0.20
      },
      keywords: ['not sure', 'right solution']
    }
  ];

  useEffect(() => {
    setSentimentData(mockSentimentData);
    
    // Calculate overall sentiment
    const sentimentCounts = mockSentimentData.reduce((acc, data) => {
      acc[data.sentiment]++;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });
    
    setOverallSentiment(sentimentCounts);
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '❓';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };

  const getSentimentBgColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100';
      case 'negative': return 'bg-red-100';
      case 'neutral': return 'bg-gray-100';
      default: return 'bg-gray-100';
    }
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

  const getEmotionColor = (emotion: string, value: number) => {
    if (value >= 0.7) return 'text-red-600';
    if (value >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredData = sentimentData.filter(data => {
    if (selectedPlatform !== 'all' && data.platform !== selectedPlatform) return false;
    return true;
  });

  const getOverallSentimentScore = () => {
    const total = overallSentiment.positive + overallSentiment.neutral + overallSentiment.negative;
    if (total === 0) return 0;
    return Math.round(((overallSentiment.positive - overallSentiment.negative) / total) * 100);
  };

  const getTopEmotions = () => {
    const emotionTotals = sentimentData.reduce((acc, data) => {
      Object.keys(data.emotions).forEach(emotion => {
        acc[emotion] = (acc[emotion] || 0) + data.emotions[emotion as keyof typeof data.emotions];
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(emotionTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([emotion, value]) => ({ emotion, value: value / sentimentData.length }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sentiment Analysis</h2>
          <p className="text-gray-600 mt-1">
            Analyze emotions and sentiment in customer messages
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {sentimentData.length} messages analyzed
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {[
              { key: '24h', label: 'Last 24 Hours' },
              { key: '7d', label: 'Last 7 Days' },
              { key: '30d', label: 'Last 30 Days' }
            ].map((range) => (
              <button
                key={range.key}
                onClick={() => setSelectedTimeRange(range.key as any)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  selectedTimeRange === range.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Platforms' },
              { key: 'FACEBOOK', label: 'Facebook' },
              { key: 'LINKEDIN', label: 'LinkedIn' },
              { key: 'INSTAGRAM', label: 'Instagram' },
              { key: 'TWITTER', label: 'Twitter' },
              { key: 'EMAIL', label: 'Email' }
            ].map((platform) => (
              <button
                key={platform.key}
                onClick={() => setSelectedPlatform(platform.key)}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  selectedPlatform === platform.key
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {platform.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Sentiment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Overall Sentiment</h3>
              <span className={`text-2xl font-bold ${
                getOverallSentimentScore() > 0 ? 'text-green-600' : 
                getOverallSentimentScore() < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {getOverallSentimentScore() > 0 ? '+' : ''}{getOverallSentimentScore()}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">😊</span>
                  <span className="text-sm text-gray-600">Positive</span>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {overallSentiment.positive}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">😐</span>
                  <span className="text-sm text-gray-600">Neutral</span>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {overallSentiment.neutral}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">😞</span>
                  <span className="text-sm text-gray-600">Negative</span>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {overallSentiment.negative}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Emotions</h3>
            <div className="space-y-3">
              {getTopEmotions().map(({ emotion, value }) => (
                <div key={emotion} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{emotion}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${value * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Breakdown</h3>
            <div className="space-y-3">
              {Array.from(new Set(sentimentData.map(d => d.platform))).map(platform => {
                const platformData = sentimentData.filter(d => d.platform === platform);
                const platformSentiment = platformData.reduce((acc, data) => {
                  acc[data.sentiment]++;
                  return acc;
                }, { positive: 0, neutral: 0, negative: 0 });
                
                const total = platformSentiment.positive + platformSentiment.neutral + platformSentiment.negative;
                const score = total > 0 ? Math.round(((platformSentiment.positive - platformSentiment.negative) / total) * 100) : 0;
                
                return (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPlatformIcon(platform)}</span>
                      <span className="text-sm text-gray-600">{platform}</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {score > 0 ? '+' : ''}{score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sentiment Data */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Message Sentiment Details</h3>
          <p className="card-description">
            Detailed sentiment analysis for individual messages
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {filteredData.map((data) => (
              <div key={data.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getPlatformIcon(data.platform)}</span>
                    <div>
                      <p className="text-sm text-gray-900">{data.message}</p>
                      <p className="text-xs text-gray-500">
                        {data.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${getSentimentColor(data.sentiment)}`}>
                      {getSentimentIcon(data.sentiment)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSentimentBgColor(data.sentiment)} ${getSentimentColor(data.sentiment)}`}>
                      {data.sentiment} ({Math.round(data.confidence * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                  {Object.entries(data.emotions).map(([emotion, value]) => (
                    <div key={emotion} className="text-center">
                      <div className={`text-sm font-medium ${getEmotionColor(emotion, value)}`}>
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {Math.round(value * 100)}%
                      </div>
                    </div>
                  ))}
                </div>

                {data.keywords.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-1">Key Terms:</div>
                    <div className="flex flex-wrap gap-1">
                      {data.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📊</div>
                <p className="text-gray-500">No sentiment data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
