/**
 * Renders text with WhatsApp-style *bold* markers inside a chat-bubble UI.
 * Supports both preview mode (bubble) and plain mode (simple text).
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface WhatsAppTextPreviewProps {
  text: string;
  className?: string;
  /** Show as chat bubble with WhatsApp styling */
  bubble?: boolean;
}

function renderWhatsAppLine(line: string, key: number) {
  if (line === '') return <br key={key} />;
  const parts = line.split(/\*(.*?)\*/g);
  return (
    <span key={key}>
      {parts.map((part, j) =>
        j % 2 === 1
          ? <strong key={j} className="text-foreground">{part}</strong>
          : part
      )}
      {'\n'}
    </span>
  );
}

export function WhatsAppTextPreview({ text, className, bubble = false }: WhatsAppTextPreviewProps) {
  if (!bubble) {
    return (
      <p className={className ?? 'text-sm leading-relaxed whitespace-pre-line text-foreground/90'}>
        {text.split('\n').map((line, i) => renderWhatsAppLine(line, i))}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className={cn(
          'relative max-w-full rounded-lg px-3 py-2 shadow-sm',
          'bg-muted text-foreground',
          'border border-border',
        )}
      >
        <p className={cn('text-sm leading-relaxed whitespace-pre-line', className)}>
          {text.split('\n').map((line, i) => renderWhatsAppLine(line, i))}
        </p>
      </div>
    </div>
  );
}
