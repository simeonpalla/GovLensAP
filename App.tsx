
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PhotoUploader from './components/PhotoUploader';
import AudioRecorder from './components/AudioRecorder';
import StatusTimeline from './components/StatusTimeline';
import { Complaint, UserRole, GroundingSource, ComplaintStatus, Severity, AIAnalysis } from './types';
import { analyzeComplaint, transcribeAudio } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('citizen');
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  // Submission Form State
  const [submission, setSubmission] = useState<{
    photo?: string;
    audio?: string;
    description: string;
    location: string;
  }>({ description: '', location: '' });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('govlens_complaints');
    if (saved) {
      setComplaints(JSON.parse(saved));
    } else {
      const mock: Complaint[] = [
        {
          id: "AP-2026-001",
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          citizen: { name: "Ravi Kumar", phone: "9876543210" },
          issue: {
            photo: "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=800&auto=format&fit=crop",
            description: "Main road near government hospital has a huge pothole causing accidents.",
            location: "Vijayawada, Ward 15"
          },
          aiAnalysis: {
            primaryDepartment: "Roads & Buildings",
            secondaryDepartments: ["Municipal Administration"],
            issueType: "Infrastructure - Road Damage",
            severity: Severity.HIGH,
            fundingRequired: true,
            estimatedCost: "₹2,50,000",
            permissionsNeeded: ["Municipal Commissioner Approval"],
            interdeptCoordination: true,
            estimatedTimeline: "14 days",
            reasoning: "High traffic zone, poses immediate risk to ambulance route."
          },
          status: ComplaintStatus.UNDER_REVIEW,
          timeline: [
            { stage: ComplaintStatus.SUBMITTED, timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
            { stage: ComplaintStatus.ASSIGNED, timestamp: new Date(Date.now() - 86400000 * 2.5).toISOString(), officer: "Suresh Babu (AE)", action: "Site inspection scheduled" },
            { stage: ComplaintStatus.UNDER_REVIEW, timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), officer: "M. Venkat (EE)", action: "Budget request initiated" }
          ]
        },
        {
           id: "AP-2026-002",
           timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
           citizen: { name: "Anita Rao", phone: "9988776655" },
           issue: {
             photo: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=800&auto=format&fit=crop",
             description: "Street lights not working for last 3 nights in Reddy Colony.",
             location: "Visakhapatnam, Ward 22"
           },
           aiAnalysis: {
             primaryDepartment: "Energy",
             secondaryDepartments: [],
             issueType: "Electrical - Street Lighting",
             severity: Severity.MEDIUM,
             fundingRequired: false,
             estimatedCost: "₹15,000",
             permissionsNeeded: ["Section Officer Approval"],
             interdeptCoordination: false,
             estimatedTimeline: "3 days",
             reasoning: "Multiple lights out in a residential area, security concern."
           },
           status: ComplaintStatus.ASSIGNED,
           timeline: [
             { stage: ComplaintStatus.SUBMITTED, timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
             { stage: ComplaintStatus.ASSIGNED, timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(), officer: "K. Reddy (Lineman)", action: "Work order created" }
           ]
        }
      ];
      setComplaints(mock);
      localStorage.setItem('govlens_complaints', JSON.stringify(mock));
    }
  }, []);

  const saveComplaints = (newComplaints: Complaint[]) => {
    setComplaints(newComplaints);
    localStorage.setItem('govlens_complaints', JSON.stringify(newComplaints));
  };

  const handleSubmitAnalysis = async () => {
    if (!submission.photo && !submission.description && !submission.audio) {
      alert("Please provide at least one form of evidence (photo, text, or voice).");
      return;
    }

    setIsProcessing(true);
    try {
      let transcript = "";
      if (submission.audio) {
        transcript = await transcribeAudio(submission.audio);
        setAudioTranscript(transcript);
      }
      
      const analysis = await analyzeComplaint(submission.photo, submission.description, transcript);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSubmission = () => {
    if (!aiAnalysis) return;

    const newComplaint: Complaint = {
      id: `AP-2026-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date().toISOString(),
      citizen: { name: "Anonymous", phone: "98XXXXXX45" },
      issue: {
        photo: submission.photo,
        description: submission.description,
        audioTranscript: audioTranscript || '',
        location: submission.location || 'Location not specified'
      },
      aiAnalysis: aiAnalysis,
      status: ComplaintStatus.SUBMITTED,
      timeline: [
        { stage: ComplaintStatus.SUBMITTED, timestamp: new Date().toISOString() }
      ]
    };

    saveComplaints([newComplaint, ...complaints]);
    setSubmission({ description: '', location: '' });
    setAiAnalysis(null);
    setAudioTranscript(null);
    setCurrentPath(`/track/${newComplaint.id}`);
  };

  const updateComplaintStatus = (id: string, stage: ComplaintStatus, officer: string, action: string) => {
    const updated = complaints.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: stage,
          timeline: [...c.timeline, { stage, timestamp: new Date().toISOString(), officer, action }]
        };
      }
      return c;
    });
    saveComplaints(updated);
  };

  const getRoute = () => {
    const parts = currentPath.split('/');
    if (parts[1] === 'track' && parts[2]) return 'track';
    if (parts[1] === 'officer' && parts[2] === 'complaint' && parts[3]) return 'officer-detail';
    return currentPath;
  };

  const route = getRoute();

  const getSeverityStyles = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL:
        return "bg-red-50 text-red-700 border-red-100";
      case Severity.HIGH:
        return "bg-orange-50 text-orange-700 border-orange-100";
      case Severity.MEDIUM:
        return "bg-blue-50 text-blue-700 border-blue-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const renderCitizenHome = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-[#2C3E50] mb-4">Voice Your Grievance</h2>
        <p className="text-lg text-[#5B7C99] max-w-2xl mx-auto">Report civic issues directly to the Andhra Pradesh government. Our AI analyzes and routes your complaint for faster resolution.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <PhotoUploader 
              onPhotoCaptured={(base64) => setSubmission(prev => ({ ...prev, photo: base64 }))} 
              isProcessing={isProcessing} 
            />
            <AudioRecorder 
              onAudioCaptured={(base64) => setSubmission(prev => ({ ...prev, audio: base64 }))}
              isProcessing={isProcessing}
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#2C3E50] mb-2">Description</label>
              <textarea 
                className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-[#5B7C99] outline-none transition h-32 placeholder-gray-400"
                placeholder="What is the issue? (e.g., Broken water pipe causing waste for 2 days...)"
                value={submission.description}
                onChange={(e) => setSubmission(prev => ({ ...prev, description: e.target.value }))}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#2C3E50] mb-2">Location</label>
              <input 
                type="text"
                className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-[#5B7C99] outline-none transition placeholder-gray-400"
                placeholder="Village, Town, or Landmark"
                value={submission.location}
                onChange={(e) => setSubmission(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            {!aiAnalysis && (
              <button 
                onClick={handleSubmitAnalysis}
                disabled={isProcessing}
                className="w-full bg-[#5B7C99] text-white py-4 rounded-xl font-bold hover:bg-[#2E5266] transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing Evidence...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.8 1.906l-1.3 1.3h4.7a1 1 0 110 2h-4.7l1.3 1.3a1 1 0 11-1.4 1.4l-3-3a1 1 0 010-1.4l3-3a1 1 0 01.1-.1zM4.3 16.953a1 1 0 01-.8-1.906l1.3-1.3H.1a1 1 0 110-2h4.7l-1.3-1.3a1 1 0 111.4-1.4l3 3a1 1 0 010 1.4l-3 3a1 1 0 01-.1.1z" clipRule="evenodd" />
                    </svg>
                    <span>Analyze Grievance</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {aiAnalysis && (
          <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-[#F8F9FA] rounded-xl p-8 border border-[#8FA9C0]/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-[#6B9080]/15 text-[#1F4D3D] px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border border-[#6B9080]/30">AI Analysis Complete</div>
                <h3 className="text-xl font-bold text-[#2C3E50]">Executive Summary</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-5">
                  <div>
                    <span className="text-xs uppercase text-gray-500 font-bold tracking-wider block mb-1">Target Department</span>
                    <p className="font-bold text-[#5B7C99] text-lg">{aiAnalysis.primaryDepartment}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-gray-500 font-bold tracking-wider block mb-1">Severity Level</span>
                    <span className={`inline-block px-3 py-1 rounded-lg font-bold border ${getSeverityStyles(aiAnalysis.severity)}`}>
                      {aiAnalysis.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-gray-500 font-bold tracking-wider block mb-1">Estimated Budget</span>
                    <p className="font-bold text-[#2C3E50] text-lg">{aiAnalysis.estimatedCost}</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div>
                    <span className="text-xs uppercase text-gray-500 font-bold tracking-wider block mb-1">AI Recommendation</span>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{aiAnalysis.reasoning}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-gray-500 font-bold tracking-wider block mb-1">Expected SLA</span>
                    <p className="font-bold text-[#5B7C99] text-lg">{aiAnalysis.estimatedTimeline}</p>
                  </div>
                </div>
              </div>

              {aiAnalysis.groundingSources && aiAnalysis.groundingSources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Grounding Sources & SOPs</p>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.groundingSources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-white text-[#5B7C99] border border-gray-100 px-3 py-1.5 rounded-lg hover:border-[#5B7C99] hover:bg-blue-50 transition shadow-sm font-medium">
                        {s.title || 'AP Gov Link'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={confirmSubmission}
                className="w-full mt-8 bg-[#2E5266] text-white py-4 rounded-xl font-bold hover:bg-[#1A2F3B] transition shadow-xl hover:shadow-[#2E5266]/20 transform active:scale-[0.98]"
              >
                Confirm & Submit to Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderMyComplaints = () => (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-[#2C3E50] mb-8">Grievance History</h2>
      {complaints.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
           <p className="text-gray-400">No complaints submitted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map(c => (
            <div 
              key={c.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition group"
              onClick={() => setCurrentPath(`/track/${c.id}`)}
            >
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                <img src={c.issue.photo || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop"} alt="Issue" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                    c.status === ComplaintStatus.RESOLVED ? 'bg-[#6B9080] text-white' : 'bg-[#5B7C99] text-white'
                  }`}>{c.status}</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-[#5B7C99] uppercase tracking-widest">{c.id}</span>
                </div>
                <h3 className="font-bold text-[#2C3E50] mb-1 truncate text-lg">{c.issue.description}</h3>
                <p className="text-xs text-gray-500 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {c.issue.location}
                </p>
                <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-3">
                  <span className="text-[10px] font-bold text-gray-400">{new Date(c.timestamp).toLocaleDateString('en-IN')}</span>
                  <span className="text-xs font-bold text-[#5B7C99] group-hover:underline">Track Status →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTrackStatus = (id: string) => {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return <div>Complaint not found.</div>;

    return (
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-grow">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
              <div className="flex justify-between items-start mb-8 border-b border-gray-50 pb-6">
                <div>
                  <h2 className="text-3xl font-extrabold text-[#2C3E50] tracking-tight">Grievance ID: {complaint.id}</h2>
                  <p className="text-gray-400 text-sm mt-1">Logged on {new Date(complaint.timestamp).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-[#F8F9FA] px-6 py-3 rounded-2xl text-center border border-gray-100">
                  <span className="text-[10px] uppercase text-gray-400 font-extrabold block tracking-widest mb-1">Current State</span>
                  <span className="font-extrabold text-[#5B7C99] uppercase text-sm">{complaint.status}</span>
                </div>
              </div>

              <div className="aspect-video rounded-2xl bg-gray-50 overflow-hidden mb-8 border border-gray-100 shadow-inner">
                <img src={complaint.issue.photo || "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=800&auto=format&fit=crop"} alt="Issue Evidence" className="w-full h-full object-cover" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Context & Evidence</h4>
                    <p className="text-[#2C3E50] leading-relaxed font-medium">{complaint.issue.description}</p>
                    {complaint.issue.audioTranscript && (
                      <div className="mt-5 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <div className="flex items-center text-blue-600 mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                          <h5 className="text-[10px] font-extrabold uppercase tracking-wider">Voice Transcript (AI Translated)</h5>
                        </div>
                        <p className="text-sm italic text-blue-900 leading-relaxed">"{complaint.issue.audioTranscript}"</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Analysis Metrics</h4>
                  <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-100 divide-y divide-gray-100">
                    <div className="flex justify-between py-3">
                      <span className="text-xs text-gray-500 font-medium">Resolution Authority</span>
                      <span className="text-xs font-bold text-[#2C3E50]">{complaint.aiAnalysis.primaryDepartment}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-xs text-gray-500 font-medium">Calculated Severity</span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${getSeverityStyles(complaint.aiAnalysis.severity)}`}>
                        {complaint.aiAnalysis.severity}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-xs text-gray-500 font-medium">Target Timeline</span>
                      <span className="text-xs font-bold text-[#5B7C99]">{complaint.aiAnalysis.estimatedTimeline}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <StatusTimeline timeline={complaint.timeline} />
          </div>

          <div className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#2C3E50] mb-5 pb-3 border-b border-gray-50">Assigned Official</h3>
              {complaint.status !== ComplaintStatus.SUBMITTED ? (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src="https://i.pravatar.cc/100?u=officer1" className="w-14 h-14 rounded-full border-2 border-[#5B7C99]/20" alt="Officer" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="font-bold text-[#2C3E50] leading-tight">{complaint.timeline.find(t => t.officer)?.officer || 'Suresh Babu'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Executive Engineer</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center animate-pulse mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 italic">Matching with nearest official...</p>
                </div>
              )}
            </div>

            <div className="bg-[#5B7C99] rounded-2xl p-7 text-white shadow-lg shadow-[#5B7C99]/20">
              <h3 className="font-bold text-lg mb-3">Direct Support</h3>
              <p className="text-xs text-blue-50 leading-relaxed mb-6 opacity-90">If you have additional evidence or need to escalate this grievance, contact our regional desk.</p>
              <button className="w-full bg-white text-[#5B7C99] font-extrabold py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-blue-50 transition shadow-md">
                Call 1902 Helpline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOfficerDashboard = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#2C3E50] tracking-tight">Active Grievance Queue</h2>
          <p className="text-[#5B7C99] font-medium mt-1">Intelligent prioritization by GovLens Core</p>
        </div>
        <div className="flex space-x-3">
           <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-0.5">Total Pending</span>
              <span className="text-lg font-extrabold text-[#2C3E50]">{complaints.length}</span>
           </div>
           <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm">
              <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest block mb-0.5">Critical</span>
              <span className="text-lg font-extrabold text-red-700">
                {complaints.filter(c => c.aiAnalysis.severity === Severity.HIGH || c.aiAnalysis.severity === Severity.CRITICAL).length}
              </span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F8F9FA] border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Complaint Meta</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Issue & Location</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Department</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Severity</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Projected Cost</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complaints.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => setCurrentPath(`/officer/complaint/${c.id}`)}>
                  <td className="px-8 py-5">
                    <span className="font-bold text-[#2C3E50]">{c.id}</span>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">{new Date(c.timestamp).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-[#2C3E50] max-w-xs truncate">{c.issue.description}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tighter">{c.issue.location}</div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] bg-[#5B7C99]/10 text-[#2C3E50] px-2.5 py-1 rounded-lg border border-[#5B7C99]/20 font-extrabold uppercase">{c.aiAnalysis.primaryDepartment}</span>
                  </td>
                  <td className="px-8 py-5">
                     <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border ${getSeverityStyles(c.aiAnalysis.severity)}`}>
                       {c.aiAnalysis.severity}
                     </span>
                  </td>
                  <td className="px-8 py-5">
                     <div className="text-sm text-[#2C3E50] font-extrabold">{c.aiAnalysis.estimatedCost}</div>
                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{c.aiAnalysis.fundingRequired ? 'Fund Approval Req' : 'Standard Budget'}</div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button className="bg-[#5B7C99] text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#2E5266] transition shadow-md group-hover:shadow-lg">Review Case</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOfficerDetail = (id: string) => {
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return <div>Complaint not found.</div>;

    return (
      <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-left-4 duration-500">
        <button onClick={() => setCurrentPath('/officer')} className="mb-8 flex items-center text-[#5B7C99] font-extrabold uppercase tracking-widest text-xs hover:text-[#2E5266] transition group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Queue
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
                 <div>
                   <h2 className="text-3xl font-extrabold text-[#2C3E50]">Case Study: {complaint.id}</h2>
                   <p className="text-gray-400 text-sm mt-1">Submitted from {complaint.issue.location}</p>
                 </div>
                 <span className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-widest border ${getSeverityStyles(complaint.aiAnalysis.severity)}`}>
                   Priority: {complaint.aiAnalysis.severity}
                 </span>
               </div>
               
               <div className="relative rounded-2xl overflow-hidden mb-8 h-[400px] shadow-lg">
                  <img src={complaint.issue.photo || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=1200&auto=format&fit=crop"} className="w-full h-full object-cover" alt="Issue Evidence" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C3E50]/80 via-transparent to-transparent flex items-end p-8">
                    <div className="text-white">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-70 mb-2">Citizen's Original Description</p>
                      <h3 className="text-xl font-bold leading-tight max-w-xl">{complaint.issue.description}</h3>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Gemini reasoning & Costing</h4>
                    <div className="p-6 bg-[#F8F9FA] rounded-2xl space-y-5 border border-gray-100">
                       <p className="text-sm leading-relaxed text-[#2C3E50] font-medium italic">"{complaint.aiAnalysis.reasoning}"</p>
                       <div className="pt-4 border-t border-gray-200">
                          <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-1">AI Cost Estimator</p>
                          <p className="text-3xl font-extrabold text-[#5B7C99]">{complaint.aiAnalysis.estimatedCost}</p>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">SOP & Jurisdictions</h4>
                    <div className="space-y-3">
                       {complaint.aiAnalysis.interdeptCoordination && (
                         <div className="flex items-center text-[10px] bg-orange-50 text-orange-700 px-4 py-3 rounded-xl font-extrabold border border-orange-100 uppercase tracking-wider">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0118 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Joint Inter-Dept Action Required
                         </div>
                       )}
                       {complaint.aiAnalysis.fundingRequired && (
                         <div className="flex items-center text-[10px] bg-blue-50 text-blue-700 px-4 py-3 rounded-xl font-extrabold border border-blue-100 uppercase tracking-wider">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                            Manual Budget Override Needed
                         </div>
                       )}
                       <div className="flex items-center text-[10px] bg-white border border-gray-100 text-gray-700 px-4 py-3 rounded-xl font-extrabold uppercase tracking-wider shadow-sm">
                          Primary Authority: {complaint.aiAnalysis.primaryDepartment}
                       </div>
                    </div>
                 </div>
               </div>
            </div>
            
            <StatusTimeline timeline={complaint.timeline} />
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-extrabold text-[#2C3E50] mb-8 pb-3 border-b border-gray-50 uppercase tracking-widest text-sm">Grievance Controls</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.ASSIGNED, 'Admin', 'Re-assigned to field engineering team')}
                  className="w-full py-4 bg-[#F8F9FA] text-[#2C3E50] rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-gray-100 transition border border-gray-200"
                >
                  Delegate to Team
                </button>
                <button 
                  onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.UNDER_REVIEW, 'M. Venkat', 'Budget approved per Gemini estimate')}
                  className="w-full py-4 bg-blue-50 text-[#5B7C99] rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-blue-100 transition border border-blue-200"
                >
                  Approve Funds
                </button>
                <button 
                  onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.ACTION_TAKEN, 'Visakha Projects Team', 'On-site restoration initiated')}
                  className="w-full py-4 bg-[#5B7C99] text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-[#2E5266] transition shadow-lg shadow-[#5B7C99]/20"
                >
                  Log Site Action
                </button>
                <button 
                  onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.RESOLVED, 'M. Venkat', 'Resolution verified by AI post-fix photo')}
                  className="w-full py-4 bg-[#6B9080] text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-[#4E6A5E] transition shadow-lg shadow-[#6B9080]/20"
                >
                  Resolve Case
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <h3 className="font-extrabold text-[#2C3E50] mb-5 uppercase tracking-widest text-sm">Internal Memo</h3>
               <textarea className="w-full bg-[#F8F9FA] border-none rounded-2xl p-4 text-sm h-40 outline-none focus:ring-2 focus:ring-[#5B7C99] placeholder-gray-400 transition" placeholder="Confidential observations for department head..."></textarea>
               <div className="flex justify-end mt-3">
                 <button className="text-[10px] font-extrabold text-[#5B7C99] uppercase tracking-widest hover:text-[#2E5266]">Save Log Entry</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const deptData = complaints.reduce((acc: any[], c) => {
      const existing = acc.find(a => a.name === c.aiAnalysis.primaryDepartment);
      if (existing) existing.value += 1;
      else acc.push({ name: c.aiAnalysis.primaryDepartment, value: 1 });
      return acc;
    }, []);

    const severityData = complaints.reduce((acc: any[], c) => {
      const existing = acc.find(a => a.name === c.aiAnalysis.severity);
      if (existing) existing.value += 1;
      else acc.push({ name: c.aiAnalysis.severity, value: 1 });
      return acc;
    }, []);

    const COLORS = ['#5B7C99', '#8FA9C0', '#6B9080', '#D4A574', '#B5838D'];

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div>
          <h2 className="text-3xl font-extrabold text-[#2C3E50] tracking-tight">Governance Intelligence</h2>
          <p className="text-[#5B7C99] font-medium mt-1">Operational metrics across Andhra Pradesh departments</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-8 uppercase tracking-widest text-xs">Load Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 600, fill: '#94A3B8' }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 600, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#F8F9FA' }} 
                  />
                  <Bar dataKey="value" fill="#5B7C99" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-[#2C3E50] mb-8 uppercase tracking-widest text-xs">Severity Matrix</h3>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-[#2C3E50] mb-8 uppercase tracking-widest text-xs">Operational Bottleneck Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex items-start bg-red-50 border border-red-100 p-6 rounded-2xl text-red-900 shadow-sm">
                <div className="bg-red-200 p-2 rounded-lg mr-4 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="text-sm">
                   <p className="font-extrabold uppercase tracking-wider mb-1">Fiscal Approval Lag</p>
                   <p className="opacity-90 leading-relaxed">3 complaints in 'Roads & Buildings' have exceeded the 7-day budget approval ceiling. Requires immediate District Collector attention.</p>
                </div>
             </div>
             <div className="flex items-start bg-amber-50 border border-amber-100 p-6 rounded-2xl text-amber-900 shadow-sm">
                <div className="bg-amber-200 p-2 rounded-lg mr-4 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm">
                   <p className="font-extrabold uppercase tracking-wider mb-1">Efficiency Variance Alert</p>
                   <p className="opacity-90 leading-relaxed">Water Department restoration velocity has dropped by 18% in the current fiscal quarter. Correlates with monsoon supply chain delays.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout role={role} setRole={setRole} onNavigate={setCurrentPath}>
      {route === '/' && renderCitizenHome()}
      {route === '/my-complaints' && renderMyComplaints()}
      {route === 'track' && renderTrackStatus(currentPath.split('/')[2])}
      {route === '/officer' && renderOfficerDashboard()}
      {route === 'officer-detail' && renderOfficerDetail(currentPath.split('/')[3])}
      {route === '/officer/analytics' && renderAnalytics()}
    </Layout>
  );
};

export default App;
