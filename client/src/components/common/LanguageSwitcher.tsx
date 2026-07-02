import { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
];

function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect current language from Google Translate cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match && match[1]) {
      setCurrentLang(match[1]);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setCurrentLang(langCode);
    setIsOpen(false);

    if (langCode === "en") {
      // Remove the googtrans cookie to reset to original language
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
      window.location.reload();
      return;
    }

    // Set the Google Translate cookie and trigger translation
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname}`;

    // Try to trigger Google Translate via the hidden select element
    const selectEl = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event("change"));
    } else {
      // If the Google Translate widget hasn't loaded yet, reload
      window.location.reload();
    }
  };

  const activeLang = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="lang-switcher-container" ref={dropdownRef}>
      <button
        className="lang-switcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
        id="language-switcher-toggle"
      >
        <span className="lang-flag">{activeLang.flag}</span>
        <span className="lang-label d-none d-md-inline">{activeLang.label}</span>
        <i className={`bi bi-chevron-${isOpen ? "up" : "down"} lang-chevron`}></i>
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-dropdown-item ${currentLang === lang.code ? "active" : ""}`}
              onClick={() => changeLanguage(lang.code)}
              id={`lang-option-${lang.code}`}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-item-label">{lang.label}</span>
              {currentLang === lang.code && (
                <i className="bi bi-check2 ms-auto text-primary"></i>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
