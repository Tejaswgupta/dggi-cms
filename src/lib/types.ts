export interface ConciseJson {
  id?: number;
  cin_no: string | null;
  registration_no: string | null;
  filing_no: string | null;

  manual_name?: string | null;
  registration_date: string;
  filing_date: string;
  first_listing_date: string;
  next_listing_date: string | null;
  last_listing_date: string | null;
  decision_date: string;
  court_no: string | null;

  disposal_nature: number | null;
  purpose_next: string | null;
  case_type: string | null;
  petitioner: string[];
  pet_name: string[];
  res_name: string[];
  respondent: string[];
  advocates?: string | null;

  judges: string;

  // Case search v1.2 refresh contract
  court_code?: string | null;
  court_query_params?: Record<string, unknown> | null;
  court_display?: Record<string, unknown> | null;
  history: HistoryData[];

  acts: Act[];
  orders: Order[];
  ia_details?: IADetail[];
  interimOrder?: any;
  finalOrder?: any;

  additional_info: Record<string, unknown> | string | null;
  original_json: OriginalJson;
  case_documents?: CaseDocument[];
  client_id?: string | null;
  client_ids?: string[] | null;
  assigned_user_ids?: string[];
  assigned_users?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  }[];
  guest_user_ids?: string[];
  guest_users?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  }[];
  created_by?: string | null;
  created_by_user?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  } | null;
  upload_tokens?: UploadTokens | null;
  case_notes?: CaseNote[];
  [key: string]: any;
}

export interface HistoryData {
  judge: string;
  business_date: string;
  hearing_date: string;
  purpose: string;
  cause_list_type: string;
}

export interface Act {
  act: string;
  section: string;
}

export interface Order {
  // Simplified order shape: date, description and a URL to the document
  date: string;
  description: string;
  document_url: string;
}

export interface IADetail {
  ia_no?: string | null;
  ia_number?: string | null;
  description?: string | null;
  party?: string | null;
  filing_date?: string | null;
  next_date?: string | null;
  status?: string | null;
  disposal_date?: string | null;
  cin_no?: string | null;
  [key: string]: any;
}

export interface OriginalJson {
  documents: Document[];
  objections: Objection[];
  history?: any;
  [key: string]: any;
}

export interface Document {
  sr_no: string;
  doc_no: string;
  date_receiving: string;
  filed_by: string;
  advocate_name: string;
  document_filed: string;
}

export interface Objection {
  sr_no: string;
  scrutiny_date: string;
  objection: string;
  compliance_date: string;
  receipt_date: string;
}

export interface Advocate {
  name: string;
}

export interface UploadTokens {
  upload_token?: string | null;
  upload_limit?: number;
  upload_token_expires?: string | null;
  download_token?: string | null;
  download_token_expires?: string | null;
}

export interface CaseDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by_name: string;
  uploaded_by_id: string;
  uploaded_by_email?: string;
  uploaded_by_phone?: string;
  created_at: string;
  source?: "manual" | "email" | "external";
}

export interface ReminderContact {
  id: string;
  type: "email" | "phone";
  value: string;
  added_by_id?: string;
  added_by_name?: string;
  created_at: string;
}

export interface CaseNote {
  id: string;
  text: string;
  html?: string;
  mentions?: string[];
  created_at: string;
  created_by_id: string;
  created_by_name: string;
  updated_at?: string;
  updated_by_id?: string;
  updated_by_name?: string;
}

export interface ArbitrationSessionMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string | null;
  created_at?: string;
}

export interface ArbitrationSessionCollectionItem {
  id: string;
  type: "document" | "folder";
  name: string;
  source: "dms" | "upload";
  document_id?: string | null;
  folder_id?: string | null;
  parent_id?: string | null;
}

export interface ArbitrationSession {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  collection: ArbitrationSessionCollectionItem[];
  messages: ArbitrationSessionMessage[];
  timeline: any[] | null;
  created_at: string;
  updated_at: string;
}
