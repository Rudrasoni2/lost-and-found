import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, MapPin, ChevronDown, ChevronUp, Brain, Cpu, Zap, CheckCircle, Info } from 'lucide-react';

export default function MatchCard({ match }) {
  const { item, similarity_score, expert_system, hybrid_score } = match;
  const [showExplanation, setShowExplanation] = useState(false);

  const aiPercent = Math.round(similarity_score * 100);
  const expertPercent = expert_system ? Math.round(expert_system.expert_score * 100) : 0;
  const hybridPercent = hybrid_score ? Math.round(hybrid_score * 100) : aiPercent;

  const getScoreColor = (percent) => {
    if (percent > 80) return 'bg-green-500';
    if (percent > 60) return 'bg-yellow-500';
    if (percent > 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getConfidenceBadge = (level) => {
    const map = {
      very_high: { label: 'Very High', cls: 'bg-green-100 text-green-700' },
      high: { label: 'High', cls: 'bg-emerald-100 text-emerald-700' },
      medium_high: { label: 'Medium-High', cls: 'bg-blue-100 text-blue-700' },
      medium: { label: 'Medium', cls: 'bg-yellow-100 text-yellow-700' },
      low: { label: 'Low', cls: 'bg-orange-100 text-orange-700' },
      none: { label: 'None', cls: 'bg-gray-100 text-gray-500' },
    };
    return map[level] || map['none'];
  };

  const hasExpertData = expert_system && expert_system.fired_rules && expert_system.fired_rules.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
      {/* Main card content */}
      <div className="p-4 flex gap-4 items-start">
        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {item.images && item.images.length > 0 ? (
            <img src={`/${item.images[0].file_path}`} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
          )}
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-gray-900 truncate pr-2">{item.name}</h4>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {item.type.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-2 truncate flex items-center gap-1">
            {item.category} • <MapPin className="w-3 h-3" /> {item.location}
          </p>

          {/* Score bars */}
          <div className="space-y-1.5">
            {/* Hybrid score (main) */}
            {hybrid_score != null && (
              <div className="flex items-center gap-2 text-xs font-medium">
                <Zap className="w-3 h-3 text-indigo-500" />
                <span className="text-gray-700 w-16">Hybrid:</span>
                <span className="text-indigo-600 font-bold w-8">{hybridPercent}%</span>
                <div className="flex-grow h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                  <div className={`h-full ${getScoreColor(hybridPercent)}`} style={{ width: `${hybridPercent}%` }}></div>
                </div>
              </div>
            )}

            {/* AI score */}
            <div className="flex items-center gap-2 text-xs">
              <Cpu className="w-3 h-3 text-blue-500" />
              <span className="text-gray-500 w-16">AI:</span>
              <span className="text-gray-600 w-8">{aiPercent}%</span>
              <div className="flex-grow h-1 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                <div className="h-full bg-blue-400" style={{ width: `${aiPercent}%` }}></div>
              </div>
            </div>

            {/* Expert system score */}
            {expert_system && (
              <div className="flex items-center gap-2 text-xs">
                <Brain className="w-3 h-3 text-purple-500" />
                <span className="text-gray-500 w-16">Expert:</span>
                <span className="text-gray-600 w-8">{expertPercent}%</span>
                <div className="flex-grow h-1 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                  <div className="h-full bg-purple-400" style={{ width: `${expertPercent}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
          <Link to={`/items/${item.id}`} className="text-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition">
            View Details
          </Link>
          <Link to={`/messages/${item.user_id}?item_id=${item.id}`} className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition">
            <MessageSquare className="w-3 h-3" /> Contact
          </Link>
        </div>
      </div>

      {/* Expert System Explanation Toggle */}
      {hasExpertData && (
        <>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-500" />
              Expert System Reasoning ({expert_system.fired_rules.length} rules fired)
            </span>
            {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showExplanation && (
            <div className="px-4 py-3 bg-purple-50/50 border-t border-gray-100">
              {/* Summary */}
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-700 font-medium">{expert_system.explanation.summary}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getConfidenceBadge(expert_system.explanation.confidence_level).cls}`}>
                      {getConfidenceBadge(expert_system.explanation.confidence_level).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fired rules */}
              <div className="space-y-1.5 mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Rules Triggered:</p>
                {expert_system.fired_rules.map((rule) => (
                  <div key={rule.rule_id} className="flex items-start gap-2 text-xs text-gray-600 bg-white rounded-md px-2.5 py-1.5 border border-gray-100">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-800">{rule.rule_name}</span>
                      <span className="text-gray-400 mx-1">—</span>
                      <span>{rule.description}</span>
                      <span className="ml-1 text-purple-600">(+{rule.score_contribution} pts)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestion */}
              <div className="text-xs text-gray-600 bg-white rounded-md px-3 py-2 border border-gray-100 italic">
                💡 {expert_system.explanation.suggestion}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
