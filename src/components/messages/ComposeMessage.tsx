import React, { useState, useEffect } from 'react';
import { Send, X, Paperclip } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User } from '../../types';
import { supabase } from '../../lib/supabase';

interface ComposeMessageProps {
  onSend: (subject: string, content: string, recipientId: string) => void;
  onCancel: () => void;
}

const ComposeMessage: React.FC<ComposeMessageProps> = ({
  onSend,
  onCancel
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, name, role')
          .in('role', ['admin', 'doctor', 'nurse'])
          .order('role');

        if (error) throw error;
        setAvailableRecipients(users || []);
      } catch (err) {
        setError('Failed to load recipients');
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject && content && recipientId) {
      onSend(subject, content, recipientId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          To:
        </label>
        <select
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select recipient</option>
          {availableRecipients.length > 0 ? (
            <>
              {/* Group users by role */}
              {['admin', 'doctor', 'nurse'].map(role => {
                const roleUsers = availableRecipients.filter(user => user.role === role);
                if (roleUsers.length === 0) return null;
                
                return (
                  <optgroup key={role} label={role.charAt(0).toUpperCase() + role.slice(1) + 's'}>
                    {roleUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </>
          ) : (
            <option disabled>No recipients available</option>
          )}
        </select>
      </div>

      <Input
        label="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          leftIcon={<Paperclip className="h-4 w-4" />}
        >
          Attach File
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          multiple
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          leftIcon={<X className="h-4 w-4" />}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          leftIcon={<Send className="h-4 w-4" />}
        >
          Send Message
        </Button>
      </div>
    </form>
  );
};

export default ComposeMessage;