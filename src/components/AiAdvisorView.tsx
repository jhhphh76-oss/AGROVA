import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  MapPin, 
  CloudSun, 
  Layers, 
  Sprout, 
  X, 
  HelpCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { AdvisorMessage, SupportedLanguage } from '../types';
import { storageService } from '../services/storage';
import { advisorService } from '../services/advisorService';
import { weatherService } from '../services/weatherService';

interface AiAdvisorViewProps {
  language: SupportedLanguage;
  locationName?: string;
  sharedScanContext?: {
    type: 'plant' | 'soil';
    summary: string;
    scanRecordId?: string;
    photoUrl?: string;
  } | null;
  onClearSharedScan?: () => void;
}

export const AiAdvisorView: React.FC<AiAdvisorViewProps> = ({
  language,
  locationName = 'Vijayapura, Karnataka',
  sharedScanContext,
  onClearSharedScan,
}) => {
  const [messages, setMessages] = useState<AdvisorMessage[]>(() => {
    return storageService.getAdvisorMessages();
  });
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeWeather, setActiveWeather] = useState<{
    temperature: number;
    weatherDescription: string;
    humidity: number;
    windSpeed: number;
    precipitationProbability: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load live weather context if available
  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        const geo = await weatherService.geocodeCity(locationName);
        const w = await weatherService.fetchLiveWeather(geo.latitude, geo.longitude, geo.locationName);
        if (isMounted && w?.current) {
          setActiveWeather({
            temperature: w.current.temperature,
            weatherDescription: w.current.weatherDescription,
            humidity: w.current.humidity,
            windSpeed: w.current.windSpeed,
            precipitationProbability: w.current.precipitationProbability,
          });
        }
      } catch {
        // Weather context is optional
      }
    };
    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [locationName]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-prompt when scan context is newly shared
  useEffect(() => {
    if (sharedScanContext) {
      setInputPrompt(
        `Can you explain this ${sharedScanContext.type === 'plant' ? 'Plant Scan' : 'Soil Scan'} and give practical guidance for my field?`
      );
    }
  }, [sharedScanContext]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);

    const userMsg: AdvisorMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      sharedScanContext: sharedScanContext || undefined,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    storageService.saveAdvisorMessages(updated);
    setInputPrompt('');

    // Clear shared scan from input banner once sent as context
    if (onClearSharedScan && sharedScanContext) {
      onClearSharedScan();
    }

    setIsLoading(true);

    try {
      const result = await advisorService.consultAdvisor({
        messages: updated.map((m) => ({ role: m.role, content: m.content })),
        sharedScanContext: userMsg.sharedScanContext,
        weatherContext: activeWeather || undefined,
        locationContext: locationName,
        language,
      });

      if (!result.success || !result.reply) {
        throw new Error(result.error || 'No response received from AI Advisor.');
      }

      const assistantMsg: AdvisorMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updated, assistantMsg];
      setMessages(finalMessages);
      storageService.saveAdvisorMessages(finalMessages);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to connect to AI Advisor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([]);
      storageService.clearAdvisorMessages();
      setErrorMsg(null);
    }
  };

  const starterQuestions = [
    'Can I apply foliar spray in today’s weather conditions?',
    'What are the signs of nitrogen deficiency vs fungal leaf spot?',
    'How should I manage irrigation for wheat during tillering stage?',
    'How can I do a quick in-field ribbon test for soil texture?',
  ];

  return (
    <div className="bg-white rounded-3xl border border-[#dce8d5] shadow-xs overflow-hidden flex flex-col h-[650px] max-h-[80vh]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#f5f9f3] border-b border-[#e2ebd9] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#14492a] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-[#144225] font-display truncate">
                AgriConnect AI Advisor
              </h3>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Online
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block truncate font-medium">
              Agricultural Guidance & Scan Interpretation
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Environmental Context Strip */}
      <div className="px-4 py-1.5 bg-[#edf5e9]/70 border-b border-[#e0ebd7] flex items-center justify-between text-[11px] text-[#245233] shrink-0">
        <div className="flex items-center gap-1 truncate font-medium">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="truncate">{locationName}</span>
        </div>
        {activeWeather && (
          <div className="flex items-center gap-1.5 shrink-0 text-slate-600">
            <CloudSun className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {activeWeather.temperature}°C, {activeWeather.windSpeed} km/h wind
            </span>
          </div>
        )}
      </div>

      {/* Shared Scan Context Banner if present */}
      {sharedScanContext && (
        <div className="p-3 bg-emerald-50/90 border-b border-emerald-200 flex items-start justify-between gap-2 text-xs shrink-0 animate-in fade-in">
          <div className="flex items-start gap-2 min-w-0">
            {sharedScanContext.type === 'plant' ? (
              <Sprout className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            ) : (
              <Layers className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-bold text-emerald-900 block truncate">
                Attached {sharedScanContext.type === 'plant' ? 'Plant Scan' : 'Soil Scan'}
              </span>
              <p className="text-[11px] text-emerald-800 line-clamp-1">{sharedScanContext.summary}</p>
            </div>
          </div>
          {onClearSharedScan && (
            <button
              onClick={onClearSharedScan}
              className="p-1 text-emerald-700 hover:text-emerald-950 rounded-lg"
              title="Remove attached scan"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafcfa]">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col justify-center items-center text-center p-4 space-y-4 max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-3xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Bot className="w-7 h-7 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#144225] font-display">
                Namaste! How can I assist your farm today?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask any question about crop health, irrigation, soil care, or share a Scan for plain-language interpretation.
              </p>
            </div>

            {/* Quick Starter Suggestions */}
            <div className="w-full space-y-1.5 pt-2 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Popular questions
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="p-2.5 rounded-2xl bg-white border border-[#dce8d5] hover:border-emerald-500 hover:bg-[#f3f9f1] text-xs text-slate-700 font-medium text-left transition shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Render Messages */}
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1.5 shadow-2xs ${
                  isUser
                    ? 'bg-[#14492a] text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-[#dce8d5] rounded-bl-xs'
                }`}
              >
                {/* Shared Scan Tag */}
                {m.sharedScanContext && isUser && (
                  <div className="mb-2 p-2 rounded-xl bg-white/15 text-[11px] border border-white/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span className="truncate">
                      Shared {m.sharedScanContext.type === 'plant' ? 'Plant Scan' : 'Soil Scan'} Result
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                <div
                  className={`text-[9px] pt-1 text-right ${
                    isUser ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 animate-in fade-in">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="p-3 bg-white border border-[#dce8d5] rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-2 text-xs text-slate-600">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] font-medium text-slate-500">Consulting agricultural knowledge...</span>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Advisor Request Failed</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
            <button
              onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
              className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-[11px] font-bold hover:bg-red-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Bar */}
      <div className="p-3 bg-white border-t border-[#e2ebd9] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask a question about crop care, pest prevention, or soil..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 bg-[#f5f8f3] border border-[#d4e4cc] rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 transition disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-[#14492a] hover:bg-[#0e3a20] active:scale-95 text-white transition disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 text-xs font-bold shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center mt-2 leading-tight">
          Weather-grounded agronomic assistance. Verify chemical spraying with official product labels & local KVK experts.
        </p>
      </div>
    </div>
  );
};
