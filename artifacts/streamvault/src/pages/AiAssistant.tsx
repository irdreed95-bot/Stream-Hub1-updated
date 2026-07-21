import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
}

// ─── Real Gemini API call — NO FALLBACKS ──────────────────────────────────────
// If the API fails, the ACTUAL error.message is shown in the chat bubble.
async function callGemini(history: Message[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set in environment variables.");

  const systemPrompt = `You are SORAD AI (سراد AI), a bilingual Arabic-English streaming assistant for the SORAD platform.
Help users find movies, TV shows, fix playback issues, and navigate the app.
Be warm, concise (2–4 sentences max), and helpful.
If the user writes in Arabic, reply ONLY in Arabic. If in English, reply ONLY in English.
App features: Movies, TV Series, Live TV, Categories, Downloads, Tickets, Chat.
Use relevant emojis occasionally.`;

  // Gemini requires alternating user/model roles — filter out errors and ensure alternation
  const turns: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];
  for (const m of history.slice(-10)) {
    if (m.role === "error") continue;
    const role: "user" | "model" = m.role === "user" ? "user" : "model";
    // Gemini disallows two consecutive messages from the same role
    if (turns.length > 0 && turns[turns.length - 1].role === role) continue;
    turns.push({ role, parts: [{ text: m.content }] });
  }
  // Must end with a user turn
  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    throw new Error("No user message to send.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: turns,
        generationConfig: { maxOutputTokens: 400, temperature: 0.85 },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  const data = await response.json();

  // Surface the real API error — no swallowing
  if (!response.ok) {
    const msg = data?.error?.message || `Gemini API returned HTTP ${response.status}`;
    throw new Error(msg);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response. Please try again.");

  return text;
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: "مرحباً! أنا سراد AI 🤖\nيمكنني مساعدتك في إيجاد أفلام ومسلسلات، أو حل أي مشكلة تقنية في التطبيق.\nكيف يمكنني مساعدتك اليوم؟",
  timestamp: Date.now(),
};

export default function AiAssistant() {
  const { isRtl } = useI18n();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Realistic typing delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    try {
      const reply = await callGemini(updatedMessages);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      }]);
    } catch (err: unknown) {
      // Show the ACTUAL error in the chat — no generic fallback
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "error",
        content: `⚠️ خطأ في Gemini API:\n${errorMsg}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => { setMessages([INITIAL_MESSAGE]); setInput(""); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="flex flex-col h-screen bg-[#06060a] pb-0" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#0d0d12] border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
            <img src="/sorad-logo.png" alt="سراد" className="w-full h-full object-contain"
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (e.currentTarget.parentElement as HTMLElement).innerHTML = '<span class="text-lg">🤖</span>';
              }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">سراد AI</h1>
            <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", hasApiKey ? "bg-green-500" : "bg-red-500")} />
              {hasApiKey ? "Gemini 1.5 Pro متصل ✨" : "⚠️ API Key مفقود"}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-primary/70 ml-1" />
        </div>
        <Button
          variant="ghost" size="icon"
          onClick={handleClear}
          className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="مسح المحادثة"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}>
            {msg.role !== "user" && (
              <div className={cn(
                "w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 mr-2 ml-0",
                msg.role === "error"
                  ? "bg-red-500/20 border-red-500/30"
                  : "bg-primary/20 border-primary/30"
              )}>
                {msg.role === "error"
                  ? <AlertCircle className="w-4 h-4 text-red-400" />
                  : <Bot className="w-4 h-4 text-primary" />}
              </div>
            )}
            <div className={cn(
              "max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                : msg.role === "error"
                ? "bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl rounded-tl-sm font-mono text-xs"
                : "bg-[#0d0d12] border border-white/8 text-foreground rounded-2xl rounded-tl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-[#0d0d12] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 sticky bottom-0 px-4 py-3 bg-[#0d0d12] border-t border-white/8">
        <div className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-[#06060a] border-white/10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40 rounded-xl"
            disabled={isTyping}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-3 shrink-0"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!hasApiKey && (
          <p className="text-[10px] text-red-400/70 text-center mt-1.5">
            VITE_GEMINI_API_KEY غير مضبوط — يرجى إضافته في متغيرات البيئة
          </p>
        )}
      </div>
    </div>
  );
}
