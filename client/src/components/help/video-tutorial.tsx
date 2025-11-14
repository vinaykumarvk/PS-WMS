/**
 * Video Tutorial Component
 * Displays embedded video tutorials with playlist support
 */

import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  category?: string;
  tags?: string[];
}

interface VideoTutorialProps {
  tutorials?: VideoTutorial[];
  className?: string;
  autoPlay?: boolean;
}

const defaultTutorials: VideoTutorial[] = [
  {
    id: '1',
    title: 'Getting Started with WealthRM',
    description: 'Learn the basics of navigating and using WealthRM platform',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder - replace with actual video
    duration: '5:30',
    category: 'Getting Started',
    tags: ['basics', 'navigation', 'overview'],
  },
  {
    id: '2',
    title: 'Adding and Managing Clients',
    description: 'Step-by-step guide to adding new clients and managing client information',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    duration: '8:15',
    category: 'Clients',
    tags: ['clients', 'onboarding', 'management'],
  },
  {
    id: '3',
    title: 'Placing Orders',
    description: 'How to create and submit investment orders for your clients',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    duration: '6:45',
    category: 'Orders',
    tags: ['orders', 'quick order', 'cart'],
  },
  {
    id: '4',
    title: 'Risk Profiling Explained',
    description: 'Understanding risk profiling and how to use it for client recommendations',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    duration: '7:20',
    category: 'Risk Profiling',
    tags: ['risk', 'profiling', 'questionnaire'],
  },
  {
    id: '5',
    title: 'Portfolio Analysis',
    description: 'How to view and analyze client portfolios',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    duration: '9:10',
    category: 'Portfolio',
    tags: ['portfolio', 'analysis', 'holdings'],
  },
];

export function VideoTutorial({
  tutorials = defaultTutorials,
  className,
  autoPlay = false,
}: VideoTutorialProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(
    tutorials.length > 0 ? tutorials[0] : null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const handleVideoSelect = (tutorial: VideoTutorial, index: number) => {
    setSelectedVideo(tutorial);
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      handleVideoSelect(tutorials[prevIndex], prevIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < tutorials.length - 1) {
      const nextIndex = currentIndex + 1;
      handleVideoSelect(tutorials[nextIndex], nextIndex);
    }
  };

  const handleFullscreen = () => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };

  // Group tutorials by category
  const tutorialsByCategory = tutorials.reduce((acc, tutorial) => {
    const category = tutorial.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tutorial);
    return acc;
  }, {} as Record<string, VideoTutorial[]>);

  if (!selectedVideo) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No video tutorials available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Main Video Player */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{selectedVideo.title}</CardTitle>
              <CardDescription className="mt-1">{selectedVideo.description}</CardDescription>
            </div>
            {selectedVideo.duration && (
              <Badge variant="secondary">{selectedVideo.duration}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Embed */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe
              src={`${selectedVideo.videoUrl}${autoPlay ? '?autoplay=1' : ''}${isMuted ? '&mute=1' : ''}`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={selectedVideo.title}
            />
          </div>

          {/* Video Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === tutorials.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleFullscreen}
                aria-label="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          {selectedVideo.tags && selectedVideo.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedVideo.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Playlist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">More Tutorials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(tutorialsByCategory).map(([category, categoryTutorials]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">{category}</h3>
                <div className="space-y-2">
                  {categoryTutorials.map((tutorial, index) => {
                    const globalIndex = tutorials.indexOf(tutorial);
                    return (
                      <div
                        key={tutorial.id}
                        className={cn(
                          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedVideo.id === tutorial.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-accent'
                        )}
                        onClick={() => handleVideoSelect(tutorial, globalIndex)}
                      >
                        <div className="flex-shrink-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                            <Play className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-1">{tutorial.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {tutorial.description}
                          </p>
                          {tutorial.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {tutorial.duration}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

