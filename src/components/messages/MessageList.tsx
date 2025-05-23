import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, Clock, Check, CheckCheck } from 'lucide-react';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, onMessageClick }) => {
  return (
    <div className="divide-y divide-gray-200">
      {messages.map((message) => (
        <div
          key={message.id}
          onClick={() => onMessageClick(message)}
          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
            !message.read ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className={`h-5 w-5 ${message.read ? 'text-gray-400' : 'text-blue-500'}`} />
              <span className="ml-2 font-medium text-gray-900">From: {message.senderId}</span>
              <span className="ml-2 text-gray-600">To: {message.receiverId}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
              {message.read ? (
                <CheckCheck className="h-4 w-4 text-blue-500" />
              ) : (
                <Check className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <h3 className={`mt-1 text-sm ${message.read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
            {message.subject}
          </h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {message.content}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MessageList;