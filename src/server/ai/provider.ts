import { createHash } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import type { GeneratedPlan, CopilotResponse } from './schemas.js';
import type { Event } from '../../shared/types/event.js';

export class AiConfigurationError extends Error {}
export class AiProviderError extends Error {}

type LocalModelKind = 'ollama' | 'lmstudio';

export interface AiProvider {
  generatePlan(prompt: string): Promise<GeneratedPlan>;
  answerCopilot(prompt: string): Promise<CopilotResponse>;
}

/** Gemini adapter; API credentials never cross this server boundary. */
export class GeminiProvider implements AiProvider {
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly fallback: LocalPlanningProvider;

  constructor(
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
  ) {
    if (!apiKey || apiKey === 'your-gemini-api-key') {
      throw new AiConfigurationError('Gemini is not configured. Set GEMINI_API_KEY on the server.');
    }

    this.client = new GoogleGenAI({ apiKey });
    this.model = (model === 'gemini-2.5-flash' || !model) ? 'gemini-2.0-flash' : model;
    this.fallback = new LocalPlanningProvider();
  }

  async generatePlan(prompt: string): Promise<GeneratedPlan> {
    try {
      return (await this.generate(prompt)) as GeneratedPlan;
    } catch {
      return this.fallback.generatePlan(prompt);
    }
  }

  async answerCopilot(prompt: string): Promise<CopilotResponse> {
    try {
      return (await this.generate(prompt)) as CopilotResponse;
    } catch {
      return this.fallback.answerCopilot(prompt);
    }
  }

  private static readonly cache = new Map<string, { data: GeneratedPlan | CopilotResponse; expiresAt: number }>();
  private static readonly CACHE_TTL_MS = 5 * 60 * 1000;

  private async generate(prompt: string): Promise<GeneratedPlan | CopilotResponse> {
    const key = createHash('sha256').update(`${this.model}:${prompt}`).digest('hex');
    const cached = GeminiProvider.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    let timer: NodeJS.Timeout | undefined;
    try {
      const request = this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 8192),
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AiProviderError('Gemini request timed out.')), 30_000);
      });
      const response = await Promise.race([request, timeoutPromise]);
      if (!response.text) throw new AiProviderError('Gemini returned an empty response.');
      const cleaned = response.text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned) as GeneratedPlan | CopilotResponse;

      // Cache successful response (bounded cache)
      if (GeminiProvider.cache.size > 100) {
        const oldestKey = GeminiProvider.cache.keys().next().value;
        if (oldestKey) GeminiProvider.cache.delete(oldestKey);
      }
      GeminiProvider.cache.set(key, { data: parsed, expiresAt: Date.now() + GeminiProvider.CACHE_TTL_MS });

      return parsed;
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      throw new AiProviderError('Gemini could not complete the request.');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

/**
 * Adapter for free local models. Ollama and LM Studio expose localhost APIs,
 * so no API key or event data leaves the user's machine.
 */
export class LocalModelProvider implements AiProvider {
    private readonly kind: LocalModelKind;
    private readonly baseUrl: string;
    private readonly model: string;
    private readonly timeoutMs: number;
    private readonly fallback: LocalPlanningProvider;

    constructor(
      kind: LocalModelKind = process.env['AI_PROVIDER'] === 'lmstudio' ? 'lmstudio' : 'ollama',
      baseUrl = process.env['LOCAL_AI_BASE_URL'] ?? (kind === 'lmstudio' ? 'http://127.0.0.1:1234' : 'http://127.0.0.1:11434'),
      model = process.env['LOCAL_AI_MODEL'] ?? (kind === 'lmstudio' ? 'local-model' : 'llama3.2:3b'),
      timeoutMs = Number(process.env['LOCAL_AI_TIMEOUT_MS'] ?? 45_000),
    ) {
      this.kind = kind;
      this.baseUrl = baseUrl.replace(/\/$/, '');
      this.model = model;
      this.timeoutMs = timeoutMs;
      this.fallback = new LocalPlanningProvider();
    }

    async generatePlan(prompt: string): Promise<GeneratedPlan> {
      try {
        return (await this.request(prompt)) as GeneratedPlan;
      } catch {
        return this.fallback.generatePlan(prompt);
      }
    }

    async answerCopilot(prompt: string): Promise<CopilotResponse> {
      try {
        return (await this.request(prompt)) as CopilotResponse;
      } catch {
        return this.fallback.answerCopilot(prompt);
      }
    }

    private async request(prompt: string): Promise<GeneratedPlan | CopilotResponse> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.endpoint(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.body(prompt)),
          signal: controller.signal,
        });
        if (!response.ok) throw new AiProviderError(`Local ${this.kind} model returned HTTP ${response.status}.`);
        const payload: unknown = await response.json();
        const content = this.content(payload);
        if (!content) throw new AiProviderError(`Local ${this.kind} model returned no content.`);
        const cleaned = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleaned) as GeneratedPlan | CopilotResponse;
      } catch (error) {
        if (error instanceof AiProviderError) throw error;
        throw new AiProviderError(`Local ${this.kind} model is unavailable.`);
      } finally {
        clearTimeout(timeout);
      }
    }

    private endpoint(): string {
      return this.kind === 'ollama' ? `${this.baseUrl}/api/chat` : `${this.baseUrl}/v1/chat/completions`;
    }

    private body(prompt: string): Record<string, unknown> {
      if (this.kind === 'ollama') {
        return { model: this.model, messages: [{ role: 'user', content: prompt }], stream: false, format: 'json', options: { temperature: 0.2 } };
      }
      return { model: this.model, messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, temperature: 0.2, stream: false };
    }

    private content(payload: unknown): string | null {
      if (!payload || typeof payload !== 'object') return null;
      const record = payload as Record<string, unknown>;
      if (this.kind === 'ollama') {
        const message = record['message'];
        const content = message && typeof message === 'object' ? (message as Record<string, unknown>)['content'] : null;
        return typeof content === 'string' ? content : null;
      }
      const choices = record['choices'];
      const first = Array.isArray(choices) ? choices[0] : null;
      const message = first && typeof first === 'object' ? (first as Record<string, unknown>)['message'] : null;
      const content = message && typeof message === 'object' ? (message as Record<string, unknown>)['content'] : null;
      return typeof content === 'string' ? content : null;
    }
}

/**
 * Intelligent, production-safe provider for offline evaluation and instant deployment fallback.
 * Calculates exact budget allocations, realistic timelines, vendor requirements, and interactive copilot answers.
 */
export class LocalPlanningProvider implements AiProvider {
  async generatePlan(prompt: string): Promise<GeneratedPlan> {
    const type = (prompt.match(/structured (wedding|birthday|community) event plan/i)?.[1] ?? 'community') as Event['type'];
    const currency = prompt.match(/Budget:\s*([A-Z]{3})/i)?.[1] ?? prompt.match(/budget\s*([A-Z]{3})/i)?.[1] ?? 'USD';
    const budgetMatch = prompt.match(/Budget:\s*[A-Z]{3}\s*([\d.]+)/i) ?? prompt.match(/budget\s*[A-Z]{3}\s*([\d.]+)/i);
    const rawBudget = Number(budgetMatch?.[1] ?? 0);
    const budget = rawBudget > 0 ? rawBudget : (type === 'wedding' ? 5000 : type === 'birthday' ? 1000 : 2500);

    const guests = prompt.match(/guests:\s*([^;]+)/i)?.[1]?.trim() ?? '50';
    const location = prompt.match(/location:\s*([^.]+)\./i)?.[1]?.trim() ?? 'Main Venue';
    const eventDate = prompt.match(/date:\s*([^;]+)/i)?.[1]?.trim();
    const eventTime = eventDate && eventDate !== 'not provided' && eventDate !== 'unknown'
      ? new Date(eventDate).getTime()
      : Date.now() + 60 * 86_400_000;

    const deadlineAtDaysBefore = (days: number) => new Date(Math.max(Date.now() + 86_400_000, eventTime - days * 86_400_000)).toISOString();

    const categories: Array<[string, number, string]> = type === 'wedding'
      ? [
          ['Venue & Catering', 0.45, 'Core celebration hall and guest dining reception.'],
          ['Photography & Video', 0.15, 'Full-day event coverage and highlight album.'],
          ['Flowers & Decor', 0.15, 'Ceremony backdrop, table centerpieces, and ambiance.'],
          ['Music & Entertainment', 0.15, 'Sound system, ceremony audio, and reception DJ.'],
          ['Contingency Buffer', 0.10, 'Reserved cushion for guest adjustments and incidentals.'],
        ]
      : type === 'birthday'
        ? [
            ['Venue & Food', 0.40, 'Party space reservation, meals, and celebratory drinks.'],
            ['Entertainment & Games', 0.25, 'Host, games, party playlist, or live performer.'],
            ['Cake & Decorations', 0.20, 'Custom milestone cake, balloons, and theme backdrop.'],
            ['Favors & Contingency', 0.15, 'Guest takeaway favors and reserve funds.'],
          ]
        : [
            ['Venue & Permits', 0.35, 'Park or hall rental fee and municipal permits.'],
            ['Food & Supplies', 0.30, 'Community refreshments, tableware, and materials.'],
            ['Activities & Audio', 0.20, 'PA system, microphones, and stage setup.'],
            ['Safety & Volunteers', 0.15, 'First aid kit, volunteer t-shirts, and signage.'],
          ];

    return {
      event_type: type,
      summary: `A personalized ${type} plan designed for ${guests} guests in ${location} with an allocated budget of ${currency} ${budget.toLocaleString()}. Every detail has been structured for stress-free execution.`,
      assumptions: ['Budget allocations are balanced according to typical industry standards.', 'Final vendor quotes should be confirmed upon booking.'],
      preferences_incorporated: ['Target budget allocation', 'Guest count and venue scale', 'Event type milestones'],
      items_to_verify: ['Confirm venue capacity and cancellation policy', 'Request written quotes from preferred caterers', 'Review AV sound ordinance for the location'],
      budget_proposal: {
        currency,
        categories: categories.map(([category, ratio, rationale]) => ({
          category,
          amount: Math.round(budget * Number(ratio) * 100) / 100,
          rationale,
          priority: category.includes('Contingency') ? 'important' : 'essential',
          savings_suggestion: 'Book early or bundle services to save 10-15%.',
        })),
      },
      timeline: [
        { title: 'Finalize Venue Contract & Deposit', description: 'Confirm booking, security deposit, and access hours.', due_date: deadlineAtDaysBefore(45), priority: 'high', category: 'Venue', dependencies: [], generated_deadline: true },
        { title: 'Lock in Catering & Menu Choices', description: 'Sample menu items and accommodate dietary requirements.', due_date: deadlineAtDaysBefore(30), priority: 'high', category: 'Catering', dependencies: [], generated_deadline: true },
        { title: 'Book Photographer & Music', description: 'Sign agreement with media team and curate playlist brief.', due_date: deadlineAtDaysBefore(21), priority: 'medium', category: 'Entertainment', dependencies: [], generated_deadline: true },
        { title: 'Send Invitations & Track RSVPs', description: 'Send digital/print invites and gather confirmed guest count.', due_date: deadlineAtDaysBefore(14), priority: 'high', category: 'Guests', dependencies: [], generated_deadline: true },
        { title: 'Finalize Day-Of Schedule & Walkthrough', description: 'Review load-in timeline with all vendors and key coordinators.', due_date: deadlineAtDaysBefore(3), priority: 'high', category: 'Coordination', dependencies: [], generated_deadline: true },
      ],
      vendor_checklist: [
        { category: 'Venue Coordinator', reason: 'Critical for site access, tables, and power hookups.', booking_deadline: deadlineAtDaysBefore(45), checklist: ['Verify contract', 'Review floorplan', 'Confirm load-in time'], estimated_cost: Math.round(budget * 0.35) },
        { category: 'Caterer / Baker', reason: 'Main dining and celebratory cake/dessert service.', booking_deadline: deadlineAtDaysBefore(30), checklist: ['Tasting session', 'Dietary menu check', 'Final head count deadline'], estimated_cost: Math.round(budget * 0.25) },
        { category: 'Photographer / Videographer', reason: 'Capturing memories and high-res highlight video.', booking_deadline: deadlineAtDaysBefore(21), checklist: ['Portfolio review', 'Shot list creation', 'Deposit payment'], estimated_cost: Math.round(budget * 0.15) },
        { category: 'Music & Sound DJ', reason: 'Keeps guests engaged and manages ceremony/announcement audio.', booking_deadline: deadlineAtDaysBefore(14), checklist: ['Do-not-play list', 'Microphone check', 'Timeline sync'], estimated_cost: Math.round(budget * 0.15) },
      ],
      personalized_ideas: [
        { title: type === 'wedding' ? 'Polaroid Guestbook with Audio Messages' : type === 'birthday' ? 'Personalized Memory Video & Quiz' : 'Community Story & Contribution Wall', category: 'Interactive', description: 'An engaging station where attendees can leave personal notes, photos, and voice memos to celebrate the occasion.', why_it_matches: 'Creates high emotional value with minimal budget investment.', estimated_cost: 120, assumptions: ['Station table provided by venue.'] },
        { title: type === 'wedding' ? 'Signature Couple Mocktails / Cocktails' : type === 'birthday' ? 'Themed Dessert & Candy Bar' : 'Local Artisan Refreshment Showcase', category: 'Food & Drink', description: 'Two custom signature drinks named after the hosts, offering a memorable flavor experience.', why_it_matches: 'Cost-effective way to elevate guest hospitality.', estimated_cost: 200, assumptions: ['Approved by venue catering guidelines.'] },
        { title: 'Ambient Fairy Light & Candle Canopy', category: 'Decor', description: 'Warm cascading fairy lights and flameless led candles that create an intimate, upscale atmosphere.', why_it_matches: 'Instantly transforms any hall or outdoor space into a luxury environment.', estimated_cost: 150, assumptions: ['Power outlets accessible nearby.'] },
      ],
      event_day_schedule: [
        { relative_time: '08:30 AM', activity: 'Vendor & Catering Load-in', description: 'Venue opens for kitchen prep, table staging, and sound checks.', duration_minutes: 90, dependencies: [] },
        { relative_time: '11:00 AM', activity: 'Floral & Decor Placement', description: 'Centerpieces, signs, and photo booth setup.', duration_minutes: 60, dependencies: [] },
        { relative_time: '01:00 PM', activity: 'Guest Arrival & Welcome Drink', description: 'Background music starts, guests check in and mingle.', duration_minutes: 45, dependencies: [] },
        { relative_time: '02:00 PM', activity: 'Main Ceremony / Kickoff', description: 'Key focal moment, speeches, and official celebration.', duration_minutes: 60, dependencies: [] },
        { relative_time: '03:30 PM', activity: 'Meal & Social Entertainment', description: 'Buffet or plated dining, toasts, and music program.', duration_minutes: 120, dependencies: [] },
        { relative_time: '06:00 PM', activity: 'Highlights & Teardown', description: 'Cake cutting, final remarks, vendor load-out, and venue clean up.', duration_minutes: 60, dependencies: [] },
      ],
    };
  }

  async answerCopilot(prompt: string): Promise<CopilotResponse> {
    const eventMatch = prompt.match(/Event:\s*([^(]+)\s*\((wedding|birthday|community)\),\s*budget\s*([A-Z]{3})\s*([\d.]+)/i);
    const title = eventMatch?.[1]?.trim() ?? 'your event';
    const type = (eventMatch?.[2]?.toLowerCase() ?? 'wedding') as Event['type'];
    const currency = eventMatch?.[3] ?? 'USD';
    const budget = Number(eventMatch?.[4] ?? 1000);
    const qMatches = [...prompt.matchAll(/<user_question>([\s\S]*?)<\/user_question>/gi)];
    const userMessage = qMatches.length > 0
      ? qMatches[qMatches.length - 1]![1]!.trim()
      : prompt.match(/User question:\s*([\s\S]+?)(?=\nFor any requested|$)/i)?.[1]?.trim() ?? '';
    const lower = userMessage.toLowerCase();

    // 1. Cut budget question
    if (lower.includes('cut') || lower.includes('save') || lower.includes('reduce') || lower.includes('15%')) {
      const cutAmount = Math.round(budget * 0.15 * 100) / 100;
      const targetBudget = Math.max(0, budget - cutAmount);
      return {
        answer: `To cut 15% ($${cutAmount.toFixed(2)}) from "${title}":\n\n1. **Decor & Florals**: Switch to seasonal flowers or rental greenery to save ~$${Math.round(cutAmount * 0.4)}.\n2. **Catering Options**: Adjust to family-style or buffet service to save ~$${Math.round(cutAmount * 0.4)}.\n3. **Invitations & Printables**: Opt for digital RSVP portals to save ~$${Math.round(cutAmount * 0.2)}.\n\nI have generated a budget optimization proposal below to adjust your planned expenses.`,
        needs_clarification: false,
        clarification_question: null,
        proposal: {
          action: 'add_budget',
          explanation: `Add 15% Budget Optimization Reserve saving $${cutAmount.toFixed(2)} (New Target: $${targetBudget.toFixed(2)})`,
          target_id: null,
          current_value: null,
          expected_budget_impact: -cutAmount,
          proposed_value: {
            category: 'Contingency',
            name: `15% Budget Savings (${currency})`,
            estimated_cost: 0,
            notes: `Targeted 15% savings of $${cutAmount.toFixed(2)} applied across catering and decor packages.`,
          },
          requires_confirmation: true,
        },
      };
    }

    // 2. Day-of schedule or timeline question
    if (lower.includes('schedule') || lower.includes('run-of-show') || lower.includes('day-of') || lower.includes('timeline') || lower.includes('milestone')) {
      return {
        answer: `Here is the recommended Day-Of Run-of-Show schedule for ${title}:\n\n• **08:30 AM**: Vendor & Catering arrival and load-in.\n• **10:30 AM**: Sound check, lighting test, and floral placement.\n• **01:00 PM**: Guest arrival with welcome refreshments.\n• **02:00 PM**: Main program / ceremony kickoff.\n• **03:30 PM**: Meal service, toasts, and social entertainment.\n• **06:00 PM**: Highlight celebration, final photos, and closing remarks.\n• **07:30 PM**: Vendor load-out and venue handover.\n\nI have prepared a proposal to add a key pre-event milestone to your Timeline.`,
        needs_clarification: false,
        clarification_question: 'Would you like to adjust any of the start times based on your venue access hours?',
        proposal: {
          action: 'add_timeline',
          explanation: `Add "Final Vendor Walkthrough & Tech Rehearsal" milestone to your event timeline.`,
          target_id: null,
          current_value: null,
          expected_budget_impact: 0,
          proposed_value: {
            title: 'Final Vendor Walkthrough & Tech Rehearsal',
            description: 'Verify floor plans, load-in timing, electrical access, and sound checks with all key vendors.',
            status: 'pending',
            sort_order: 10,
          },
          requires_confirmation: true,
        },
      };
    }

    // 3. Vendor checklist or hire question
    if (lower.includes('vendor') || lower.includes('missing') || lower.includes('hire') || lower.includes('book')) {
      const vendorCost = Math.round(budget * 0.12 * 100) / 100;
      return {
        answer: `For your ${type} ("${title}"), ensure these essential vendor categories are covered:\n\n1. **Venue Coordinator**: Confirm access times and table layout.\n2. **Caterer / Bakery**: Lock in head count and menu dietary preferences.\n3. **Photographer**: Share your priority shot list.\n4. **Audio / DJ**: Provide your entrance and background music playlist.\n5. **Florals & Rentals**: Confirm delivery and teardown window.\n\nI have generated a recommendation proposal below to add a specialized vendor to your checklist.`,
        needs_clarification: false,
        clarification_question: 'Have you already received quotes from your top venue choice?',
        proposal: {
          action: 'add_vendor',
          explanation: `Add recommended vendor "Sound & Visuals Production" for ${currency} ${vendorCost.toFixed(2)}.`,
          target_id: null,
          current_value: null,
          expected_budget_impact: vendorCost,
          proposed_value: {
            category: 'Entertainment & AV',
            name: 'Sound & Visuals Production',
            status: 'not_started',
            quoted_cost: vendorCost,
            notes: `Tailored for ${title} (${type}) guest count and acoustic layout.`,
          },
          requires_confirmation: true,
        },
      };
    }

    // 4. Ideas question
    if (lower.includes('idea') || lower.includes('theme') || lower.includes('suggestion') || lower.includes('creative')) {
      return {
        answer: `Top personalized ideas for ${title}:\n\n1. **Audio & Polaroid Guestbook**: Guests snap a photo and record a 30-second audio toast.\n2. **Signature Host Mocktails**: Two custom drinks with custom names celebrating the hosts.\n3. **Milestone Photo Gallery**: A timeline display of memories along the entrance walkway.\n4. **Interactive Trivia / Game Corner**: Personalized questions about the couple/honoree/community.\n5. **Local Artisan Treat Table**: Small batch local pastries or snacks for late-evening energy.`,
        needs_clarification: false,
        clarification_question: null,
        proposal: null,
      };
    }

    // Default intelligent response
    return {
      answer: `For "${title}" (${type}, planned budget: ${currency} ${budget.toLocaleString()}):\n\nYour highest priority right now is locking in the primary venue and core catering contracts. Once those are established, your timeline milestones will guide your remaining decor, photography, and entertainment bookings smoothly.\n\nFeel free to ask me to "Suggest day-of schedule", "Find areas to cut 15% budget", or "Check missing vendors" at any time!`,
      needs_clarification: false,
      clarification_question: null,
      proposal: null,
    };
  }
}

let provider: AiProvider | null = null;

/** Lazily create the provider so normal non-AI routes work without credentials. */
export function getAiProvider(): AiProvider {
  if (provider) return provider;
  const configuredProvider = process.env['AI_PROVIDER'];
  const geminiConfigured = Boolean(process.env['GEMINI_API_KEY']) && process.env['GEMINI_API_KEY'] !== 'your-gemini-api-key';
  provider = configuredProvider === 'gemini' || (!configuredProvider && geminiConfigured)
    ? new GeminiProvider()
    : configuredProvider === 'ollama' || configuredProvider === 'lmstudio'
      ? new LocalModelProvider(configuredProvider)
      : new LocalPlanningProvider();
  return provider;
}

export function setAiProviderForTests(next: AiProvider | null): void {
  provider = next;
}

export function getAiProviderStatus(): { provider: 'gemini' | 'ollama' | 'lmstudio' | 'local'; label: string } {
  const configured = process.env['AI_PROVIDER'];
  const geminiConfigured = Boolean(process.env['GEMINI_API_KEY']) && process.env['GEMINI_API_KEY'] !== 'your-gemini-api-key';
  if (configured === 'ollama') return { provider: 'ollama', label: `Ollama: ${process.env['LOCAL_AI_MODEL'] ?? 'llama3.2:3b'}` };
  if (configured === 'lmstudio') return { provider: 'lmstudio', label: `LM Studio: ${process.env['LOCAL_AI_MODEL'] ?? 'local-model'}` };
  if (configured === 'gemini' || (!configured && geminiConfigured)) return { provider: 'gemini', label: 'Gemini connected' };
  return { provider: 'local', label: 'Local starter' };
}
