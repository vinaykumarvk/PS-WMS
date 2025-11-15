import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: Date | string | null;
  completed: boolean;
  priority?: string | null;
  aiPriorityScore?: number;
  aiPriorityLabel?: "critical" | "high" | "medium" | "low";
  autoCompletePrompt?: string | null;
}

const priorityBadgeStyles: Record<NonNullable<Task["aiPriorityLabel"]>, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  medium: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300",
  low: "bg-slate-100 text-slate-900 dark:bg-slate-900/30 dark:text-slate-300",
};

function getPriorityBadge(task: Task) {
  const label = task.aiPriorityLabel ?? "medium";
  const displayScore = typeof task.aiPriorityScore === "number" ? Math.round(task.aiPriorityScore) : "--";
  return (
    <Badge
      variant="secondary"
      className={`text-[10px] font-semibold tracking-wide uppercase ${priorityBadgeStyles[label]}`}
    >
      AI {label} · {displayScore}
    </Badge>
  );
}

export function TasksCard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number, completed: boolean }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleTaskToggle = (task: Task, completed: boolean) => {
    updateTaskMutation.mutate({ id: task.id, completed });
  };
  
  const formatDueDate = (date?: Date | string | null) => {
    if (!date) return "";

    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (dueDate.getTime() === today.getTime()) {
      return "Due today";
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return "Due tomorrow";
    } else if (dueDate.getTime() === yesterday.getTime()) {
      return "Due yesterday";
    } else if (dueDate < today) {
      return "Overdue";
    } else {
      const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Tasks</h2>
          <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
        </div>
      </div>
      
      <div className="divide-y divide-border">
        {isLoading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} className="px-4 py-3">
              <div className="flex items-start">
                <Skeleton className="h-4 w-4 rounded mr-3 mt-1" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task: Task) => (
            <div key={task.id} className="px-4 py-3">
              <div className="flex items-start">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={(checked) => handleTaskToggle(task, !!checked)}
                  className="h-4 w-4 rounded mt-1"
                />
                <label htmlFor={`task-${task.id}`} className="ml-3 block">
                  <span className={`text-sm font-medium ${
                    task.completed ? "text-muted-foreground line-through" : "text-foreground"
                  }`}>
                    {task.title}
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {getPriorityBadge(task)}
                    <span className={`text-xs ${task.completed ? "text-muted-foreground" : "text-muted-foreground"}`}>
                      {task.completed ? "Completed" : formatDueDate(task.dueDate)}
                    </span>
                  </div>
                  {task.autoCompletePrompt && !task.completed && (
                    <p className="mt-2 text-[11px] text-primary/80 italic">
                      {task.autoCompletePrompt}
                    </p>
                  )}
                </label>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No tasks to display</p>
          </div>
        )}
      </div>
      
      <CardFooter className="px-4 py-3 bg-muted/30 flex justify-center">
        <Button variant="link" size="sm" className="text-xs font-medium text-primary hover:text-primary/80">
          View All Tasks
        </Button>
      </CardFooter>
    </Card>
  );
}
