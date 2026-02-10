
import React from 'react';
import { TimelineEvent, ComplaintStatus } from '../types';

interface StatusTimelineProps {
  timeline: TimelineEvent[];
}

const STAGES = [
  ComplaintStatus.SUBMITTED,
  ComplaintStatus.ASSIGNED,
  ComplaintStatus.UNDER_REVIEW,
  ComplaintStatus.ACTION_TAKEN,
  ComplaintStatus.RESOLVED
];

const StatusTimeline: React.FC<StatusTimelineProps> = ({ timeline }) => {
  return (
    <div className="mt-12 animate-in fade-in duration-700">
      <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mb-8">Process Continuity</h3>
      <div className="relative">
        {/* Continuous Progress Line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-100 ml-[-1px]"></div>
        
        <div className="space-y-10">
          {timeline.map((event, index) => (
            <div key={index} className="relative pl-12 group">
              {/* Status Indicator Dot */}
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm border-2 ${
                event.stage === ComplaintStatus.RESOLVED ? 'bg-[#6B9080] border-[#6B9080]' : 'bg-[#5B7C99] border-[#5B7C99]'
              }`}>
                {event.stage === ComplaintStatus.RESOLVED ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-1">
                  <h4 className="font-extrabold text-[#2C3E50] uppercase tracking-wider text-sm">{event.stage}</h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    {new Date(event.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                </div>
                {event.officer && (
                  <p className="text-xs text-[#5B7C99] font-extrabold uppercase tracking-wide mb-1">Authenticated by: {event.officer}</p>
                )}
                {event.action && (
                  <p className="text-sm text-gray-500 font-medium leading-relaxed mt-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-200 mr-2"></span>
                    {event.action}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Pending Stages (Higher contrast for better visibility) */}
          {STAGES.filter(stage => !timeline.find(t => t.stage === stage)).map((stage, index) => (
             <div key={`pending-${index}`} className="relative pl-12 opacity-60">
                <div className="absolute left-0 w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center z-10">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
                <div className="p-6 rounded-2xl border border-dashed border-gray-200">
                  <h4 className="font-bold text-gray-400 uppercase tracking-wider text-xs">{stage}</h4>
                  <p className="text-[10px] text-gray-300 font-bold mt-1 uppercase tracking-tighter">Awaiting sequence initiation...</p>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
