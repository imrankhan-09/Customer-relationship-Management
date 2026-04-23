// src/components/opportunity/PipelineStage.jsx
import React from 'react';
import { useState } from 'react';

const stages = ['New', 'Contacted', 'Demo', 'Negotiation', 'Won', 'Lost'];

const dummyLeadsByStage = {
  New: [{ id: 1, name: 'Dr. Smith' }, { id: 2, name: 'MediCare' }],
  Contacted: [{ id: 3, name: 'City Hospital' }],
  Demo: [{ id: 4, name: 'Dr. Johnson' }],
  Negotiation: [{ id: 5, name: 'Wellness Lab' }],
  Won: [{ id: 6, name: 'Pharma Inc' }],
  Lost: [{ id: 7, name: 'Old Clinic' }],
};

const PipelineStage = () => {
  const [leads, setLeads] = useState(dummyLeadsByStage);
  const [draggedLead, setDraggedLead] = useState(null);

  const handleDragStart = (e, lead, fromStage) => {
    setDraggedLead({ lead, fromStage });
  };

  const handleDrop = (e, toStage) => {
    e.preventDefault();
    if (!draggedLead) return;
    const { lead, fromStage } = draggedLead;
    if (fromStage === toStage) return;

    setLeads(prev => {
      const newLeads = { ...prev };
      newLeads[fromStage] = prev[fromStage].filter(l => l.id !== lead.id);
      newLeads[toStage] = [...prev[toStage], lead];
      return newLeads;
    });
    setDraggedLead(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const moveLead = (lead, fromStage, toStage) => {
    setLeads(prev => {
      const newLeads = { ...prev };
      newLeads[fromStage] = prev[fromStage].filter(l => l.id !== lead.id);
      newLeads[toStage] = [...prev[toStage], lead];
      return newLeads;
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map(stage => (
        <div
          key={stage}
          className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-3"
          onDrop={(e) => handleDrop(e, stage)}
          onDragOver={handleDragOver}
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-700">{stage}</h4>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{leads[stage]?.length || 0}</span>
          </div>
          <div className="space-y-2">
            {leads[stage]?.map(lead => (
              <div
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead, stage)}
                className="bg-white p-3 rounded-lg shadow-sm border cursor-move hover:shadow-md transition"
              >
                <p className="font-medium text-sm">{lead.name}</p>
                <div className="flex gap-1 mt-2">
                  {stages.filter(s => s !== stage).map(s => (
                    <button
                      key={s}
                      onClick={() => moveLead(lead, stage, s)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Move to {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PipelineStage;