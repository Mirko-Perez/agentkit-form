import React from 'react';
import { QuestionStats } from '../types/survey';

interface QuestionStatsProps {
  stats: QuestionStats;
}

export const QuestionStatsComponent: React.FC<QuestionStatsProps> = ({ stats }) => {
  const renderChart = () => {
    const entries = Object.entries(stats.response_distribution);

    if (entries.length === 0) {
      return <p className="text-gray-500">No responses yet</p>;
    }

    const maxCount = Math.max(...entries.map(([_, count]) => count));

    return (
      <div className="space-y-2">
        {entries.map(([option, count]) => {
          const percentage = stats.total_responses > 0 ? (count / stats.total_responses) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={option} className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{option}</span>
                  <span className="text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRatingStats = () => {
    if (stats.average_rating === undefined) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">⭐</span>
          <span className="font-semibold text-blue-800">
            Average Rating: {stats.average_rating.toFixed(1)} / 5
          </span>
        </div>
      </div>
    );
  };

  const renderTextResponses = () => {
    if (!stats.text_responses || stats.text_responses.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Sample Responses:</h4>
        <div className="space-y-2">
          {stats.text_responses.map((response, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 italic">"{response}"</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {stats.question_text}
      </h3>

      <div className="mb-4 text-sm text-gray-600">
        Total responses: {stats.total_responses}
      </div>

      {renderChart()}
      {renderRatingStats()}
      {renderTextResponses()}
    </div>
  );
};
