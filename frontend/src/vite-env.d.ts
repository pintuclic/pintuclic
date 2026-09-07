/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
  clientId?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleIdPromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void;
        prompt: (notification?: (promptNotification: GoogleIdPromptNotification) => void) => void;
        renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        revoke: (hint: string, callback?: () => void) => void;
      };
    };
  };
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
