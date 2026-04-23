export default function StatsCard({ title, value, icon, color = "blue" }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
    green: "text-green-600 bg-green-50",
  };

  return (
    <div className="stats-card">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-4xl font-semibold mt-4 text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}