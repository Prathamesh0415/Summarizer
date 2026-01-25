import React from "react";
import Link from "next/link";
import { 
  Youtube, 
  Link as LinkIcon, 
  FileText, 
  Zap, 
  Clock, 
  BrainCircuit, 
  Menu, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";

// 8bitcn Components
import { Button } from "@/components/ui/8bit/button";
import { Badge } from "@/components/ui/8bit/badge";
import { Input } from "@/components/ui/8bit/input";
import { Separator } from "@/components/ui/8bit/separator";
import { Textarea } from "@/components/ui/8bit/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/8bit/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/8bit/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/8bit/navigation-menu";

export default function SummarizerLandingPage() {
  return (
    <div className="min-h-screen bg-background font-mono selection:bg-primary selection:text-primary-foreground">
      
      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-50 w-full border-b-4 border-muted bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BrainCircuit size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Summ.AI</span>
          </div>

          {/* Desktop Nav - Centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                <NavigationMenuItem>
                  <Link href="#how-it-works" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      How It Works
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="#features" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Features
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="#pricing" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Pricing
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Auth Buttons (Desktop) */}
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login"><Button variant="ghost" className="hover:bg-muted">Login</Button></Link>
            <Link href="/register"><Button className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]">
              Register
            </Button></Link>
          </div>
          

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden border-2 border-black">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="text-left">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-8">
                <Link href="#how-it-works" className="text-lg font-medium hover:underline">How It Works</Link>
                <Link href="#features" className="text-lg font-medium hover:underline">Features</Link>
                <Link href="#pricing" className="text-lg font-medium hover:underline">Pricing</Link>
                <Separator className="my-2" />
                <Link href="/login"></Link><Button variant="outline" className="w-full border-2 border-black">Login</Button>
                <Link href="/register"></Link><Button className="w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Register</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex flex-col items-center w-full">
        
        {/* --- HERO SECTION --- */}
        <section className="w-full py-24 md:py-32 flex flex-col items-center text-center px-6">
          <Badge variant="outline" className="mb-6 text-sm px-4 py-1.5 border-2 border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            ✨ Beta v1.0 • Now Live
          </Badge>
          
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight lg:text-7xl mb-8 leading-[1.1]">
            Read Less. <br />
            <span className="text-primary underline decoration-wavy decoration-4 underline-offset-8">Know More.</span>
          </h1>
          
          <p className="max-w-2xl text-xl text-muted-foreground mb-12 leading-relaxed">
            Turn long articles and hour-long YouTube videos into concise, 
            8-bit style summaries in seconds.
          </p>

          {/* Interactive Input Box - Centered */}
          <div className="w-full max-w-xl flex flex-col sm:flex-row gap-4 p-3 border-4 border-muted rounded-xl bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
            <Input 
              placeholder="Paste YouTube or Article URL..." 
              className="flex-1 border-2 border-black h-14 text-md px-4"
            />
            <Button size="lg" className="h-14 px-8 border-2 border-black text-md font-bold shrink-0">
              <Zap className="mr-2 h-5 w-5" /> Summarize
            </Button>
          </div>
          
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>No credit card required for first 10 summaries.</span>
          </div>
        </section>

        <Separator className="w-full max-w-6xl" />

        {/* --- HOW IT WORKS (TABS) --- */}
        <section id="how-it-works" className="w-full py-24 bg-muted/10 flex flex-col items-center px-6">
          <div className="text-center mb-16 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Source</h2>
            <p className="text-lg text-muted-foreground">
              Switch between video and text modes seamlessly. We handle the parsing logic for you.
            </p>
          </div>

          <div className="w-full max-w-4xl">
            <Tabs defaultValue="youtube" className="w-full flex flex-col items-center">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-16 border-2 border-black bg-muted p-1 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <TabsTrigger value="youtube" className="text-md font-bold data-[state=active]:bg-background data-[state=active]:border-2 data-[state=active]:border-black h-full">
                  <Youtube className="mr-2 h-5 w-5" /> YouTube
                </TabsTrigger>
                <TabsTrigger value="web" className="text-md font-bold data-[state=active]:bg-background data-[state=active]:border-2 data-[state=active]:border-black h-full">
                  <LinkIcon className="mr-2 h-5 w-5" /> Article
                </TabsTrigger>
              </TabsList>

              {/* YouTube Tab Content */}
              <TabsContent value="youtube" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">Video Processing Engine</CardTitle>
                    <CardDescription>Automated transcript extraction & analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 p-6 md:p-8">
                    <div className="grid gap-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Input Source</label>
                      <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 font-mono text-sm flex items-center gap-3">
                        <Youtube className="h-5 w-5 text-red-500" />
                        youtube.com/watch?v=dQw4w9WgXcQ
                      </div>
                    </div>
                    
                    <div className="flex justify-center -my-2">
                        <div className="bg-background border-2 border-muted rounded-full p-2 z-10">
                            <ArrowRight className="text-primary animate-pulse" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Summary</label>
                      <Textarea 
                        readOnly 
                        className="min-h-[140px] bg-yellow-50/50 dark:bg-zinc-900 border-2 border-muted resize-none font-mono text-sm leading-relaxed p-4"
                        value="• Key Point 1: The video discusses the importance of reliability in relationships.&#10;&#10;• Key Point 2: The speaker creates a contract of commitment promises.&#10;&#10;• Conclusion: A strong recursive loop of 'never giving up' is established."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Web Tab Content */}
              <TabsContent value="web" className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-background">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">Article Distiller</CardTitle>
                    <CardDescription>Ad removal & NLP summarization</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 p-6 md:p-8">
                     <div className="grid gap-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Input Source</label>
                      <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30 font-mono text-sm flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-blue-500" />
                        techcrunch.com/2025/01/01/future-of-ai
                      </div>
                    </div>

                    <div className="flex justify-center -my-2">
                        <div className="bg-background border-2 border-muted rounded-full p-2 z-10">
                            <ArrowRight className="text-primary animate-pulse" />
                        </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Summary</label>
                      <Textarea 
                        readOnly 
                        className="min-h-[140px] bg-blue-50/50 dark:bg-zinc-900 border-2 border-muted resize-none font-mono text-sm leading-relaxed p-4"
                        value="SUMMARY:&#10;The article explores the rapid adoption of retro UI design in 2025. It highlights how developers are moving away from minimalism toward nostalgic, tactile interfaces that emphasize fun over pure utility."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section id="features" className="w-full py-24 px-6 flex flex-col items-center">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Use Summ.AI?</h2>
            <p className="text-lg text-muted-foreground">Built for productivity, styled for nostalgia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
            {/* Feature 1 */}
            <Card className="bg-primary/5 border-2 border-primary hover:translate-y-[-4px] transition-transform duration-300">
              <CardHeader className="flex flex-col items-center text-center pb-2">
                <div className="p-3 bg-background border-2 border-primary rounded-full mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Save Hours</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Don't watch a 45-minute tutorial to find one command. Get the TL;DW instantly.
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-secondary/20 border-2 border-secondary-foreground hover:translate-y-[-4px] transition-transform duration-300">
              <CardHeader className="flex flex-col items-center text-center pb-2">
                <div className="p-3 bg-background border-2 border-secondary-foreground rounded-full mb-4">
                  <Youtube className="w-8 h-8 text-red-500" />
                </div>
                <CardTitle className="text-xl">Native YouTube</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Paste a link directly. We handle captions, timestamps, and context automatically.
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-green-500/10 border-2 border-green-600 hover:translate-y-[-4px] transition-transform duration-300">
              <CardHeader className="flex flex-col items-center text-center pb-2">
                <div className="p-3 bg-background border-2 border-green-600 rounded-full mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Export to Docs</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                One-click export your summaries to Markdown, PDF, or directly to Notion.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="w-full py-24 px-6 flex justify-center">
          <div className="bg-muted w-full max-w-5xl p-10 md:p-16 rounded-3xl border-4 border-dashed border-muted-foreground/30 flex flex-col items-center text-center gap-8">
            <h2 className="text-3xl md:text-5xl font-bold">Ready to reclaim your time?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Join 10,000+ developers who read less and build more.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-md">
              <Button size="lg" className="text-lg px-10 h-14 w-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                Register Now
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-10 h-14 w-full border-2 border-black bg-background">
                View Pricing
              </Button>
            </div>
          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="w-full border-t-4 border-muted py-12 bg-muted/20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6 px-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-sm border border-black">
              <BrainCircuit size={18} />
            </div>
            <span className="font-bold text-lg">Summ.AI</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © 2025 8-Bit Summarizer Inc.
          </div>
          
          <div className="flex gap-8 text-sm font-medium underline decoration-dotted underline-offset-4">
            <Link href="#" className="hover:text-primary">Privacy</Link>
            <Link href="#" className="hover:text-primary">Terms</Link>
            <Link href="#" className="hover:text-primary">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}