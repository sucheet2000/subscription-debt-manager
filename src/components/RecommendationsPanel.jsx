import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react';

export default function RecommendationsPanel({ recommendations, onDismiss }) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-400/50';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-400/50';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-400/50';
      default:
        return 'bg-gray-100 dark:bg-gray-800/30 border-gray-300 dark:border-gray-400/50';
    }
  };

  const getSeverityTextColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-700 dark:text-red-300';
      case 'medium':
        return 'text-yellow-700 dark:text-yellow-300';
      case 'low':
        return 'text-blue-700 dark:text-blue-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getDescriptionTextColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-900 dark:text-gray-300';
      case 'medium':
        return 'text-yellow-900 dark:text-gray-300';
      case 'low':
        return 'text-blue-900 dark:text-gray-300';
      default:
        return 'text-gray-900 dark:text-gray-300';
    }
  };

  const getImpactTextColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-800 dark:text-gray-400';
      case 'medium':
        return 'text-yellow-800 dark:text-gray-400';
      case 'low':
        return 'text-blue-800 dark:text-gray-400';
      default:
        return 'text-gray-800 dark:text-gray-400';
    }
  };

  const getSeverityLabel = (severity) => {
    const labels = {
      high: t('recommendations.severity.high', 'High Priority'),
      medium: t('recommendations.severity.medium', 'Medium Priority'),
      low: t('recommendations.severity.low', 'Low Priority'),
    };
    return labels[severity] || severity;
  };

  return (
    <div className="bg-gradient-to-r from-accent-300/10 to-accent-200/5 border border-accent-300/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb size={20} className="text-accent-400 dark:text-accent-300" />
          <h2 className="text-lg font-semibold text-accent-600 dark:text-accent-300">
            {t('recommendations.title', 'Smart Recommendations')}
          </h2>
          <span className="bg-accent-300/20 text-accent-600 dark:text-accent-300 text-xs font-semibold px-2 py-1 rounded-full">
            {recommendations.length}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800/50 rounded transition-colors"
          title="Dismiss recommendations"
        >
          <X size={18} className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
        </button>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-lg p-4 transition-all cursor-pointer ${getSeverityColor(
              rec.severity
            )}`}
            onClick={() =>
              setExpandedId(expandedId === rec.id ? null : rec.id)
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${getSeverityTextColor(
                      rec.severity
                    )}`}
                  >
                    {getSeverityLabel(rec.severity)}
                  </span>
                </div>
                <p className={`text-sm ${getDescriptionTextColor(rec.severity)}`}>{rec.description}</p>
                {rec.impact && (
                  <p className={`text-xs ${getImpactTextColor(rec.severity)} mt-2`}>
                    <span className="font-semibold">{t('recommendations.impact', 'Potential Impact')}:</span> {rec.impact}
                  </p>
                )}
              </div>
              <button className="ml-4 flex-shrink-0">
                {expandedId === rec.id ? (
                  <ChevronUp size={18} className="text-gray-800 dark:text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-800 dark:text-gray-400" />
                )}
              </button>
            </div>

            {expandedId === rec.id && rec.details && (
              <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700/50">
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                  {rec.details}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
