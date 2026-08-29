import { useState, useRef, useEffect } from "react";
import { sendAIChatMessage } from "../../services/aiService";
import { useAuthContext } from "../../context/useAuthContext";

const QUICK_PROMPTS = [
  { label: "🏛️ Top Attractions", prompt: "What are the top verified attractions along this route and near the destination?" },
  { label: "🍽️ Best Food Stops", prompt: "Where are the best recommended dining and cafe stops on this drive?" },
  { label: "🏨 Where to Stay", prompt: "Suggest verified hotels and stays near my destination." },
  { label: "📅 Draft Itinerary", prompt: "Create a draft day-by-day travel itinerary using the discovered stops." },
  { label: "🚨 Safety & Fuel", prompt: "Give me an emergency, safety, and refueling check for this journey." },
];

export default function AITravelAssistant({ route }) {
  const { session } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I'm your **SmartTravel AI Assistant**. I can help you find top attractions, plan food and rest stops, suggest hotels, or draft an itinerary grounded on real places along your route.",
      recommendedPlaces: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    if (!session?.token) {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: query,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          role: "assistant",
          text: "🔒 Please log in to your account to use the AI Travel Assistant.",
          recommendedPlaces: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setInputMessage("");
      return;
    }

    const userMessage = {
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const tripContext = route
        ? {
            start: route.start,
            destination: route.destination,
            distance: route.distance,
            duration: route.duration,
            places: route.places || [],
            emergencyServices: route.emergencyServices || {},
          }
        : {};

      const response = await sendAIChatMessage({
        message: query,
        tripContext,
        token: session.token,
      });

      const assistantMessage = {
        role: "assistant",
        text: response.reply,
        recommendedPlaces: response.recommendedPlaces || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `⚠️ Error getting AI response: ${err.message}. Please try again.`,
          recommendedPlaces: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageText = (text) => {
    // Simple parser for bolding **text** and bullet lines
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      const isBullet = line.trim().startsWith("•") || line.trim().startsWith("*");
      const isHeader = line.trim().startsWith("###") || line.trim().startsWith("##");

      // Replace **text** with strong tag
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-cyan-200">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isHeader) {
        return (
          <p key={idx} className="mt-2 font-semibold text-white">
            {formattedParts}
          </p>
        );
      }

      if (isBullet) {
        return (
          <p key={idx} className="ml-2 pl-2 text-slate-300">
            {formattedParts}
          </p>
        );
      }

      return (
        <p key={idx} className={line.trim() === "" ? "h-2" : "text-slate-300"}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-105 hover:shadow-cyan-500/40"
        >
          <span className="text-lg">✨</span>
          <span>AI Travel Assistant</span>
          {route && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="flex h-[560px] w-[380px] sm:w-[440px] flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-sm">
                ✨
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">AI Travel Assistant</h4>
                <p className="text-xs text-slate-400">
                  {route ? `Grounded on ${route.destination?.name || "active route"}` : "Route planning & recommendations"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-slate-800/80 bg-slate-900/40 p-2 scrollbar-none">
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => handleSendMessage(item.prompt)}
                className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-cyan-400 hover:bg-slate-700 hover:text-white disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-3.5 shadow-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none"
                      : "border border-slate-800 bg-slate-900/90 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <div className="space-y-1">{formatMessageText(msg.text)}</div>

                  {/* Recommended POI Cards embedded in chat response */}
                  {msg.recommendedPlaces?.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-800 pt-2.5">
                      <p className="text-[11px] font-semibold text-cyan-300">
                        📍 Referenced Verified Places:
                      </p>
                      <div className="space-y-1.5">
                        {msg.recommendedPlaces.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/80 p-2 border border-slate-800"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{p.name}</p>
                              <p className="truncate text-[10px] text-slate-400">
                                {p.category.toUpperCase()} • {p.address || "On route"}
                              </p>
                            </div>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-cyan-200 hover:border-cyan-300 hover:text-white"
                            >
                              Map
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[10px] text-slate-500 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-slate-400 w-fit">
                <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs">AI is thinking & analyzing places...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-slate-800 bg-slate-900/80 p-3 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                route
                  ? "Ask about attractions, food, hotels..."
                  : "Plan a trip first to ask route questions..."
              }
              disabled={loading}
              className="flex-1 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-slate-950 font-bold transition hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
