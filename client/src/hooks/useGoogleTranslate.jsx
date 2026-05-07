import { useEffect } from "react";

/**
 * Hook to initialize Google Translate on app startup.
 * Dynamically loads the Google Translate script and sets up the init callback.
 * Supports: English (en), Chinese (zh-CN), Bahasa Melayu (ms).
 */
export default function useGoogleTranslate() {
  useEffect(() => {
    // Skip if already loaded
    if (window.googleTranslateElementInit) return;

    // Define the global callback that Google Translate script will invoke
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,zh-CN,ms",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // Dynamically load the Google Translate script
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount (unlikely for App-level hook, but good practice)
      document.body.removeChild(script);
      delete window.googleTranslateElementInit;
    };
  }, []);
}
