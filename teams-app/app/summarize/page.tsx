"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, AlertCircle } from "lucide-react";

// 1. Import your custom hook
import { useFetch } from "@/hooks/useFetch"; // Adjust path if needed

// 2. Import 8-bit UI components
import { Button } from "@/components/ui/8bit/button";
import { Input } from "@/components/ui/8bit/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/8bit/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SummarizerPage() {
  const fetchWithAuth = useFetch(); // Initialize your custom hook
  
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary("");

    try {
      // 3. Use your custom fetchWithAuth
      // Note: We pass the object directly. Your hook handles JSON.stringify automatically.
      const response = await fetchWithAuth("/api/protected/summarize", {
        method: "POST",
        body: { url }, 
      });

      // Note: We don't need to check (!response.ok) here because 
      // your useFetch hook throws an error automatically if status is not 2xx.

      // 4. Handle Cache Hit (JSON) vs Live Stream
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        // CACHE HIT: Standard JSON response
        const data = await response.json();
        setSummary(data.summary);
      } else {
        // STREAM: Reading the ReadableStream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("Failed to initialize stream reading");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          setSummary((prev) => prev + text); // Real-time append
        }
      }
    } catch (err: any) {
      console.error("Summarization Error:", err);
      setError(err.message || "Something went wrong while summarizing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center gap-8 transition-colors duration-300">
      
      {/* Input Section */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">URL Summarizer</CardTitle>
          <CardDescription>
            Paste a YouTube video or Article URL to get an instant AI summary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSummarize} className="flex flex-col gap-4">
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Summarize"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {/* Only show this card if we have content or are loading */}
      {(summary || loading) && (
        <Card className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Using prose (Tailwind Typography) to style the markdown nicely.
              'prose-stone' gives it a neutral, clean look.
              'dark:prose-invert' ensures it looks good in dark mode.
            */}
            <div className="prose prose-stone dark:prose-invert max-w-none break-words">
              {summary ? (
                <ReactMarkdown>{summary}</ReactMarkdown>
              ) : (
                <div className="flex flex-col gap-2 opacity-50 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}