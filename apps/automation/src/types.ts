export interface AutomateArgs {
  url: string;
  name: string;
  email: string;
  phone?: string;
  cvPath: string;
  message: string;
  sessionPath: string;
  headless: boolean;
  resumeFrom?: string;
}

export interface AutomationEvent {
  event: string;
  data?: Record<string, unknown>;
}

export interface FieldHints {
  labels?: string[];
  ariaLabels?: string[];
  placeholders?: string[];
  cssSelectors?: string[];
}
