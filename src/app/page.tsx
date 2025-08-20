"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  generateGroundedResponse,
  type GenerateGroundedResponseOutput,
} from "@/ai/flows/generate-grounded-response";
import { ResultsDisplay } from "@/components/results-display";
import { LoadingState } from "@/components/loading-state";
import { Search } from "lucide-react";

const formSchema = z.object({
  query: z.string().min(2, {
    message: "Query must be at least 2 characters.",
  }),
});

export default function Home() {
  const [response, setResponse] =
    useState<GenerateGroundedResponseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResponse(null);
    try {
      const result = await generateGroundedResponse({ query: values.query });
      setResponse(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response from Gemini. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Find Your Next Travel Experience
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Tell us what you're looking for, and we'll suggest destinations,
            activities, and itineraries grounded in real-time information.
          </p>
        </header>

        <Card className="w-full shadow-lg">
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex items-start gap-4"
              >
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input
                          placeholder="e.g., 'family-friendly beach vacation in Southeast Asia'"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} size="lg">
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="w-full min-h-[20rem]">
          {isLoading ? (
            <LoadingState />
          ) : response ? (
            <ResultsDisplay data={response} />
          ) : (
            <Card className="text-center p-12 border-dashed flex items-center justify-center h-full">
              <h2 className="text-xl font-medium text-muted-foreground">
                Let's plan your next adventure!
              </h2>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
