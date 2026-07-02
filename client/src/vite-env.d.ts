/// <reference types="vite/client" />

interface Window {
  googleTranslateElementInit?: () => void;
  google?: {
    translate: {
      TranslateElement: new (options: any, elementId: string) => any;
    };
  };
}
