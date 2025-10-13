'use client';

import { useState, useRef } from 'react';
import { ContentType, ContentStatus } from '@/types';

interface ContentEditorProps {
  initialData?: {
    title: string;
    type: ContentType;
    status: ContentStatus;
    tags: string[];
    body: string;
  };
  onSave: (data: {
    title: string;
    type: ContentType;
    status: ContentStatus;
    tags: string[];
    body: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ContentEditor({ 
  initialData, 
  onSave, 
  onCancel, 
  loading = false 
}: ContentEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<ContentType>(initialData?.type || 'BLOG');
  const [status, setStatus] = useState<ContentStatus>(initialData?.status || 'DRAFT');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [body, setBody] = useState(initialData?.body || '');
  const [newTag, setNewTag] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    onSave({
      title: title.trim(),
      type,
      status,
      tags,
      body: body.trim()
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit Content' : 'Create New Content'}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={loading || !title.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Enter content title..."
              disabled={loading}
            />
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
                className="input w-full"
                disabled={loading}
              >
                <option value="BLOG">Blog Post</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="SOCIAL_POST">Social Post</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className="input w-full"
                disabled={loading}
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    disabled={loading}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="input flex-1"
                placeholder="Add a tag..."
                disabled={loading}
              />
              <button
                onClick={handleAddTag}
                className="btn-outline"
                disabled={loading || !newTag.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <div className="border border-gray-300 rounded-md">
              {/* Simple Toolbar */}
              <div className="border-b border-gray-300 p-2 bg-gray-50">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = textareaRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = body.substring(start, end);
                        const newText = body.substring(0, start) + `**${selectedText}**` + body.substring(end);
                        setBody(newText);
                      }
                    }}
                    className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = textareaRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = body.substring(start, end);
                        const newText = body.substring(0, start) + `*${selectedText}*` + body.substring(end);
                        setBody(newText);
                      }
                    }}
                    className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = textareaRef.current;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const newText = body.substring(0, start) + '\n\n---\n\n' + body.substring(start);
                        setBody(newText);
                      }
                    }}
                    className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    —
                  </button>
                </div>
              </div>
              
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-96 p-4 border-0 resize-none focus:ring-0 focus:outline-none"
                placeholder="Write your content here... Use **bold**, *italic*, and --- for horizontal rules."
                disabled={loading}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Use Markdown syntax: **bold**, *italic*, --- for horizontal rules. Press Ctrl+Enter to save.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
