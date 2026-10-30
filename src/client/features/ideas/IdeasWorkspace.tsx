import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ideasApi, planningApi } from '../../shared/api/client';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Spinner from '../../shared/components/Spinner';
import { showToast } from '../../shared/components/toastBus';
import type { Idea } from '../../../shared/types/idea';
import BackButton from '../../shared/components/BackButton';
import Tilt3DCard from '../../shared/components/Tilt3DCard';
import { fireConfetti } from '../../shared/utils/confettiBurst';

const TAG_CHIPS = ['#All', '#BudgetFriendly', '#Entertainment', '#Decor', '#Interactive', '#Food & Drink'];

/** Displays generated ideas as safe, persistable records with save/dismiss, budget, and timeline actions. */
export default function IdeasWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('#All');
  const [addedToBudget, setAddedToBudget] = useState<Set<string>>(new Set());
  const [addedToTimeline, setAddedToTimeline] = useState<Set<string>>(new Set());

  const handleGenerateIdeas = async () => {
    if (!id) return;
    setGenerating(true);
    setError(null);
    try {
      const generated = await ideasApi.generate(id);
      fireConfetti(undefined, undefined, 60);
      showToast(`Generated ${generated.length} personalized ideas!`, 'success');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to generate ideas.');
    } finally {
      setGenerating(false);
    }
  };

  const load = async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      setIdeas(await ideasApi.list(id));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load ideas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchIdeas = async () => {
      if (!id) return;
      try {
        const data = await ideasApi.list(id);
        if (!cancelled) setIdeas(data);
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load ideas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchIdeas();
    return () => { cancelled = true; };
  }, [id]);

  const update = async (idea: Idea, status: 'saved' | 'dismissed') => {
    if (!id) return;
    try {
      await (status === 'saved' ? ideasApi.save(id, idea.id) : ideasApi.remove(id, idea.id));
      showToast(status === 'saved' ? 'Idea saved to your plan' : 'Idea dismissed', 'info');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update idea.');
    }
  };

  const addToBudgetAction = async (idea: Idea) => {
    if (!id) return;
    try {
      await planningApi.budget.create(id, {
        category: idea.category || 'Personalized Ideas',
        name: idea.title,
        estimated_cost: idea.estimated_cost ?? 0,
      });
      setAddedToBudget((prev) => new Set(prev).add(idea.id));
      fireConfetti(undefined, undefined, 45);
      showToast(`Added "${idea.title}" to Budget items`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add to budget', 'error');
    }
  };

  const addToTimelineAction = async (idea: Idea) => {
    if (!id) return;
    try {
      await planningApi.timeline.create(id, {
        title: idea.title,
      });
      setAddedToTimeline((prev) => new Set(prev).add(idea.id));
      fireConfetti(undefined, undefined, 45);
      showToast(`Added "${idea.title}" to Timeline milestones`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add to timeline', 'error');
    }
  };

  const filteredIdeas = useMemo(() => {
    const active = ideas.filter((idea) => idea.status !== 'dismissed');
    if (selectedTag === '#All') return active;

    return active.filter((idea) => {
      const text = `${idea.title} ${idea.description} ${idea.category}`.toLowerCase();
      if (selectedTag === '#BudgetFriendly') return (idea.estimated_cost != null && idea.estimated_cost < 250) || text.includes('budget') || text.includes('diy');
      if (selectedTag === '#Entertainment') return text.includes('music') || text.includes('game') || text.includes('dance') || text.includes('entertainment');
      if (selectedTag === '#Decor') return text.includes('decor') || text.includes('floral') || text.includes('flower') || text.includes('light');
      if (selectedTag === '#Interactive') return text.includes('interactive') || text.includes('guest') || text.includes('activity') || text.includes('photo');
      if (selectedTag === '#Food & Drink') return text.includes('food') || text.includes('drink') || text.includes('cake') || text.includes('catering') || text.includes('bar');
      return true;
    });
  }, [ideas, selectedTag]);

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Spinner size="lg" />
        <span className="sr-only">Loading ideas</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <BackButton />
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Personalization studio</p>
          <h1 className="page-title">Personalized Ideas</h1>
          <p className="page-subtitle">
            Review generated creative suggestions, filter by tag, and directly convert them into budget items or timeline tasks.
          </p>
        </div>
        <Button onClick={() => void handleGenerateIdeas()} loading={generating}>
          ✨ Generate Ideas with AI
        </Button>
      </div>

      {error && (
        <Card>
          <p className="form-error" role="alert">{error}</p>
          <Button className="mt-4" onClick={() => void load()}>Retry</Button>
        </Card>
      )}

      {/* Tag Chips Filter */}
      <Card className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Filter by Concept Tag:
          </span>
          <div className="flex flex-wrap gap-2">
            {TAG_CHIPS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white/5 text-surface-400 hover:text-surface-200 hover:bg-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Ideas Grid */}
      <Card>
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-surface-400 mb-4">
              {ideas.length === 0
                ? 'No personalized ideas yet for this event.'
                : `No ideas found matching "${selectedTag}". Try selecting another tag.`}
            </p>
            {ideas.length === 0 && (
              <Button size="sm" onClick={() => void handleGenerateIdeas()} loading={generating}>
                ⚡ Auto-Generate Creative Ideas
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredIdeas.map((idea) => {
              const hasBudget = addedToBudget.has(idea.id);
              const hasTimeline = addedToTimeline.has(idea.id);

              return (
                <Tilt3DCard key={idea.id} intensity={8} glare={true} className="rounded-2xl h-full">
                  <article
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-white/20 hover:shadow-lg flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="eyebrow text-brand-300 font-semibold">{idea.category}</span>
                        {idea.estimated_cost != null && (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                            Est. ${idea.estimated_cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-surface-100">{idea.title}</h2>
                      <p className="mt-2 text-sm text-surface-300 leading-relaxed">{idea.description}</p>
                    </div>

                    {/* Actions Bar */}
                    <div className="mt-5 border-t border-white/5 pt-4 space-y-2">
                      {/* Primary Convert Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void addToBudgetAction(idea)}
                          disabled={hasBudget}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                            hasBudget
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-brand-600/20 text-brand-300 border border-brand-500/30 hover:bg-brand-600/30'
                          }`}
                        >
                          {hasBudget ? '✓ In Budget' : '+ Add to Budget'}
                        </button>

                        <button
                          type="button"
                          onClick={() => void addToTimelineAction(idea)}
                          disabled={hasTimeline}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                            hasTimeline
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30'
                          }`}
                        >
                          {hasTimeline ? '✓ In Timeline' : '+ Add to Timeline'}
                        </button>
                      </div>

                      {/* Save / Dismiss Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <Button
                          size="sm"
                          onClick={() => void update(idea, 'saved')}
                          disabled={idea.status === 'saved'}
                          variant={idea.status === 'saved' ? 'secondary' : 'primary'}
                        >
                          {idea.status === 'saved' ? 'Saved' : 'Save Idea'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => void update(idea, 'dismissed')}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </article>
                </Tilt3DCard>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

