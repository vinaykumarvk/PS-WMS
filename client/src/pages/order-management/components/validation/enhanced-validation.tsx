import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type ValidationSeverity = 'error' | 'warning' | 'info' | 'success';

export interface ValidationMessage {
  id: string;
  message: string;
  severity: ValidationSeverity;
  field?: string;
}

interface EnhancedValidationProps {
  messages: ValidationMessage[];
  className?: string;
  showSuccess?: boolean;
  inline?: boolean;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    className: 'border-red-500 bg-red-50 text-red-900',
    iconClassName: 'text-red-600',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-amber-500 bg-amber-50 text-amber-900',
    iconClassName: 'text-amber-600',
  },
  info: {
    icon: Info,
    className: 'border-blue-500 bg-blue-50 text-blue-900',
    iconClassName: 'text-blue-600',
  },
  success: {
    icon: CheckCircle2,
    className: 'border-green-500 bg-green-50 text-green-900',
    iconClassName: 'text-green-600',
  },
};

export function EnhancedValidation({
  messages,
  className,
  showSuccess = false,
  inline = false,
}: EnhancedValidationProps) {
  const filteredMessages = showSuccess
    ? messages
    : messages.filter((m) => m.severity !== 'success');

  if (filteredMessages.length === 0) {
    return null;
  }

  if (inline) {
    return (
      <div className={cn('space-y-1', className)}>
        {filteredMessages.map((msg) => {
          const config = severityConfig[msg.severity];
          const Icon = config.icon;

          return (
            <div
              key={msg.id}
              className={cn(
                'flex items-start gap-2 text-xs px-2 py-1 rounded',
                config.className
              )}
            >
              <Icon className={cn('h-3 w-3 mt-0.5 shrink-0', config.iconClassName)} />
              <span>{msg.message}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {filteredMessages.map((msg) => {
        const config = severityConfig[msg.severity];
        const Icon = config.icon;

        return (
          <Alert key={msg.id} className={cn(config.className)}>
            <Icon className={cn('h-4 w-4', config.iconClassName)} />
            <AlertDescription className="text-sm">{msg.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}

interface ValidationProviderProps {
  children: ReactNode;
  messages: ValidationMessage[];
  showSuccess?: boolean;
}

export function ValidationProvider({ children, messages, showSuccess = false }: ValidationProviderProps) {
  return (
    <div className="space-y-4">
      {children}
      <EnhancedValidation messages={messages} showSuccess={showSuccess} />
    </div>
  );
}

