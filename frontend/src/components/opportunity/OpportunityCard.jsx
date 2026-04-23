// src/components/opportunity/OpportunityCard.jsx
const OpportunityCard = ({ opportunity }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800">{opportunity.name}</h4>
          <p className="text-sm text-gray-500">{opportunity.stage}</p>
        </div>
        <span className="text-lg font-bold text-blue-600">${opportunity.value}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${opportunity.probability}%` }}></div>
        </div>
        <span className="text-xs text-gray-500">{opportunity.probability}%</span>
      </div>
    </div>
  );
};

export default OpportunityCard;