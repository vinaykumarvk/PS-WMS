import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MessageSquare, Phone, Mail, Plus, CheckSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface QuickActionContext {
  clientId?: number;
  clientName?: string;
  prospectId?: number;
  prospectName?: string;
  type?: 'client' | 'prospect' | 'task' | 'alert';
}

interface QuickActionsWorkflowProps {
  context?: QuickActionContext;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export function QuickActionsWorkflow({ 
  context, 
  variant = 'button',
  size = 'sm'
}: QuickActionsWorkflowProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'meeting',
    priority: 'medium',
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });
  
  const [communicationForm, setCommunicationForm] = useState({
    subject: '',
    message: '',
    type: 'email',
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['/api/clients'],
  });

  const handleDialogClose = () => {
    setActiveDialog(null);
    // Reset forms
    setAppointmentForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      type: 'meeting',
      priority: 'medium',
    });
    setTaskForm({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
    });
    setCommunicationForm({
      subject: '',
      message: '',
      type: 'email',
    });
  };

  // Pre-populate forms with context
  const openScheduleDialog = () => {
    if (context?.clientName) {
      setAppointmentForm(prev => ({
        ...prev,
        title: `Review Meeting - ${context.clientName}`,
        description: `Scheduled review meeting with ${context.clientName}`,
      }));
    } else if (context?.prospectName) {
      setAppointmentForm(prev => ({
        ...prev,
        title: `Meeting - ${context.prospectName}`,
        description: `Meeting with prospect ${context.prospectName}`,
      }));
    }
    setActiveDialog('schedule');
  };

  const openTaskDialog = () => {
    if (context?.clientName) {
      setTaskForm(prev => ({
        ...prev,
        title: `Follow up with ${context.clientName}`,
        description: `Task related to ${context.clientName}`,
      }));
    } else if (context?.prospectName) {
      setTaskForm(prev => ({
        ...prev,
        title: `Follow up with ${context.prospectName}`,
        description: `Task related to prospect ${context.prospectName}`,
      }));
    }
    setActiveDialog('task');
  };

  const openCommunicationDialog = () => {
    if (context?.clientName) {
      setCommunicationForm(prev => ({
        ...prev,
        subject: `Re: ${context.clientName}`,
      }));
    } else if (context?.prospectName) {
      setCommunicationForm(prev => ({
        ...prev,
        subject: `Re: ${context.prospectName}`,
      }));
    }
    setActiveDialog('communication');
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/appointments', {
        title: appointmentForm.title,
        description: appointmentForm.description,
        startTime: appointmentForm.startTime,
        endTime: appointmentForm.endTime,
        type: appointmentForm.type,
        priority: appointmentForm.priority,
        clientId: context?.clientId || null,
        prospectId: context?.prospectId || null,
      });
      
      if (response.ok) {
        toast({
          title: "Appointment scheduled",
          description: "Your appointment has been successfully scheduled.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
        handleDialogClose();
      } else {
        throw new Error('Failed to schedule appointment');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/tasks', {
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        clientId: context?.clientId || null,
        prospectId: context?.prospectId || null,
      });
      
      if (response.ok) {
        toast({
          title: "Task created",
          description: "Your task has been successfully created.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        handleDialogClose();
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/communications', {
        subject: communicationForm.subject,
        message: communicationForm.message,
        type: communicationForm.type,
        clientId: context?.clientId || null,
        prospectId: context?.prospectId || null,
      });
      
      if (response.ok) {
        toast({
          title: "Message sent",
          description: "Your message has been successfully sent.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/communications'] });
        handleDialogClose();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickOrder = () => {
    if (context?.clientId) {
      navigate(`/order-management?clientId=${context.clientId}`);
    } else {
      navigate('/order-management');
    }
  };

  const actions = [
    {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      action: openScheduleDialog,
      show: true,
    },
    {
      id: 'task',
      label: 'Task',
      icon: CheckSquare,
      action: openTaskDialog,
      show: true,
    },
    {
      id: 'message',
      label: 'Message',
      icon: MessageSquare,
      action: openCommunicationDialog,
      show: true,
    },
    {
      id: 'order',
      label: 'Place Order',
      icon: Plus,
      action: handleQuickOrder,
      show: !!context?.clientId,
    },
  ].filter(action => action.show);

  if (variant === 'icon') {
    return (
      <>
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size={size}
              onClick={action.action}
              className="h-7 w-7 p-0"
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Schedule Dialog */}
        <Dialog open={activeDialog === 'schedule'} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-title">Title</Label>
                <Input
                  id="appointment-title"
                  value={appointmentForm.title}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-description">Description</Label>
                <Textarea
                  id="appointment-description"
                  value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment-start">Start Time</Label>
                  <Input
                    id="appointment-start"
                    type="datetime-local"
                    value={appointmentForm.startTime}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-end">End Time</Label>
                  <Input
                    id="appointment-end"
                    type="datetime-local"
                    value={appointmentForm.endTime}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointment-type">Type</Label>
                  <Select
                    value={appointmentForm.type}
                    onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-priority">Priority</Label>
                  <Select
                    value={appointmentForm.priority}
                    onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {context?.clientId && (
                <div className="text-sm text-muted-foreground">
                  Client: {context.clientName || `Client #${context.clientId}`}
                </div>
              )}
              {context?.prospectId && (
                <div className="text-sm text-muted-foreground">
                  Prospect: {context.prospectName || `Prospect #${context.prospectId}`}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Task Dialog */}
        <Dialog open={activeDialog === 'task'} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input
                    id="task-due"
                    type="datetime-local"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(value) => setTaskForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {context?.clientId && (
                <div className="text-sm text-muted-foreground">
                  Client: {context.clientName || `Client #${context.clientId}`}
                </div>
              )}
              {context?.prospectId && (
                <div className="text-sm text-muted-foreground">
                  Prospect: {context.prospectName || `Prospect #${context.prospectId}`}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Communication Dialog */}
        <Dialog open={activeDialog === 'communication'} onOpenChange={(open) => !open && handleDialogClose()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSendCommunication} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comm-type">Type</Label>
                <Select
                  value={communicationForm.type}
                  onValueChange={(value) => setCommunicationForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comm-subject">Subject</Label>
                <Input
                  id="comm-subject"
                  value={communicationForm.subject}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comm-message">Message</Label>
                <Textarea
                  id="comm-message"
                  value={communicationForm.message}
                  onChange={(e) => setCommunicationForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={5}
                  required
                />
              </div>
              {context?.clientId && (
                <div className="text-sm text-muted-foreground">
                  Client: {context.clientName || `Client #${context.clientId}`}
                </div>
              )}
              {context?.prospectId && (
                <div className="text-sm text-muted-foreground">
                  Prospect: {context.prospectName || `Prospect #${context.prospectId}`}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Button variant
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size={size}
          onClick={action.action}
        >
          <action.icon className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}

