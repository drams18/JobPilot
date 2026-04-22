export interface AutomateArgs {
  url: string;
  name: string;
  email: string;
  phone?: string;
  cvPath: string;
  message: string;
  sessionPath: string;
  headless: boolean;
}

export interface AutomationEvent {
  event:
    | 'navigating'
    | 'page_loaded'
    | 'field_filled'
    | 'upload_done'
    | 'ready_for_review'
    | 'submitted'
    | 'cancelled'
    | 'heartbeat'
    | 'error'
    | 'process_exit';
  data?: Record<string, unknown>;
}

export interface FieldHints {
  labels?: string[];
  ariaLabels?: string[];
  placeholders?: string[];
  cssSelectors?: string[];
}
