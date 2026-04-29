export const PIPELINE_STAGES = [
  { id: 'new', label: 'Discovery', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Qualified', color: 'bg-indigo-500' },
  { id: 'demo', label: 'Presentation', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-500' },
  { id: 'won', label: 'Closure', color: 'bg-emerald-500' }
];

export const getStageLabel = (stageId) => {
  const stage = PIPELINE_STAGES.find(s => s.id === stageId);
  return stage ? stage.label : stageId;
};

export const getStageColor = (stageId) => {
  const stage = PIPELINE_STAGES.find(s => s.id === stageId);
  return stage ? stage.color : 'bg-slate-500';
};
