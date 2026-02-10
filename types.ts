
export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum ComplaintStatus {
  SUBMITTED = 'Submitted',
  ASSIGNED = 'Assigned',
  UNDER_REVIEW = 'Under Review',
  ACTION_TAKEN = 'Action Taken',
  RESOLVED = 'Resolved'
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface AIAnalysis {
  primaryDepartment: string;
  secondaryDepartments: string[];
  issueType: string;
  severity: Severity;
  fundingRequired: boolean;
  estimatedCost: string;
  permissionsNeeded: string[];
  interdeptCoordination: boolean;
  estimatedTimeline: string;
  reasoning: string;
  groundingSources?: GroundingSource[];
}

export interface TimelineEvent {
  stage: ComplaintStatus;
  timestamp: string;
  officer?: string;
  action?: string;
}

export interface Complaint {
  id: string;
  timestamp: string;
  citizen: {
    name: string;
    phone: string;
  };
  issue: {
    photo?: string; // base64
    description: string;
    audioTranscript?: string;
    location: string;
  };
  aiAnalysis: AIAnalysis;
  status: ComplaintStatus;
  timeline: TimelineEvent[];
}

export type UserRole = 'citizen' | 'officer';
