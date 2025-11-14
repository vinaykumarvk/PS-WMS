/**
 * Help Center Page
 * Central hub for all help resources: FAQs, tutorials, and contextual help
 */

import React, { useState } from 'react';
import { HelpCircle, BookOpen, Video, MessageCircle, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FAQComponent } from '@/components/help/faq-component';
import { VideoTutorial } from '@/components/help/video-tutorial';
import { ContextualHelp, useContextualHelp } from '@/components/help/contextual-help';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { useOnboarding } from '@/hooks/use-onboarding';
import { getAllTours } from '@/components/onboarding/onboarding-steps';
// Get current route from hash
function useCurrentRoute() {
  const [route, setRoute] = React.useState(() => {
    const hash = window.location.hash.replace(/^#/, '');
    const [routePath] = (hash || '/').split('?');
    return routePath || '/';
  });

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const [routePath] = (hash || '/').split('?');
      setRoute(routePath || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('faq');
  const { startTour } = useOnboarding();
  const currentRoute = useCurrentRoute();
  const contextualHelp = useContextualHelp(
    currentRoute === '/' ? 'dashboard' : currentRoute.split('/')[1] || 'dashboard'
  );

  const tours = getAllTours();

  const handleStartTour = (tourId: string) => {
    const tour = tours.find(t => t.id === tourId);
    if (tour) {
      startTour(tour);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Help Center
        </h1>
        <p className="text-muted-foreground">
          Find answers, watch tutorials, and learn how to use WealthRM effectively
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search help articles, FAQs, and tutorials..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('faq')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              FAQs
            </CardTitle>
            <CardDescription>Find answers to common questions</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('tutorials')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Tutorials
            </CardTitle>
            <CardDescription>Watch step-by-step video guides</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('tours')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Interactive Tours
            </CardTitle>
            <CardDescription>Take guided tours of the platform</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="tutorials">Video Tutorials</TabsTrigger>
          <TabsTrigger value="tours">Interactive Tours</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-6">
          <FAQComponent />
        </TabsContent>

        <TabsContent value="tutorials" className="mt-6">
          <VideoTutorial />
        </TabsContent>

        <TabsContent value="tours" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Onboarding Tours</CardTitle>
                <CardDescription>
                  Take guided tours to learn about different features of WealthRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tours.map(tour => (
                    <Card key={tour.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{tour.name}</CardTitle>
                        <CardDescription>{tour.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {tour.steps.length} steps
                          </p>
                          <Button
                            onClick={() => handleStartTour(tour.id)}
                            className="w-full"
                          >
                            Start Tour
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contextual Help */}
      {contextualHelp && (
        <Card>
          <CardHeader>
            <CardTitle>Help for Current Page</CardTitle>
            <CardDescription>
              Contextual help based on where you are in the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContextualHelp content={contextualHelp} variant="inline" />
          </CardContent>
        </Card>
      )}

      {/* Onboarding Tour Component */}
      <OnboardingTour />
    </div>
  );
}

