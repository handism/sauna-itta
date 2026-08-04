"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Search, Loader2, X, MapPin, AlertCircle } from "lucide-react";
import { searchLocation, GeocodingResult } from "../../utils/geocoding";

interface LocationSearchInputProps {
  onSelectLocation: (result: GeocodingResult) => void;
  placeholder?: string;
  /** 外側の label と htmlFor で紐づけるための id */
  inputId?: string;
}

const OPTION_ID_PREFIX = "location-search-option-";

export function LocationSearchInput({
  onSelectLocation,
  placeholder = "施設名や住所で場所を検索...",
  inputId,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coolingDown, setCoolingDown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // query が空になったら検索結果をリセットする（onChange から直接呼び出す）
  const resetSearchState = () => {
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    setIsLoading(false);
    setErrorMessage(null);
    setActiveIndex(-1);
  };

  useEffect(() => () => {
    requestControllerRef.current?.abort();
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
  }, []);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || isLoading || coolingDown) return;

    const controller = new AbortController();
    requestControllerRef.current?.abort();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setCoolingDown(true);
    cooldownTimerRef.current = setTimeout(() => setCoolingDown(false), 1000);

    try {
      const data = await searchLocation(trimmed, controller.signal);
      setResults(data);
      setErrorMessage(null);
      setIsOpen(true);
      setHasSearched(true);
      setActiveIndex(-1);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error("Search failed:", error);
      setResults([]);
      setErrorMessage("場所を検索できませんでした。通信環境を確認して再度お試しください。");
      setIsOpen(true);
      setHasSearched(true);
      setActiveIndex(-1);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // アクティブな候補を可視範囲へスクロール
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(
      `#${OPTION_ID_PREFIX}${activeIndex}`
    );
    // jsdom など scrollIntoView 未実装の環境を考慮して optional call にする
    activeEl?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = (result: GeocodingResult) => {
    onSelectLocation(result);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setErrorMessage(null);
  };

  const handleClear = () => {
    requestControllerRef.current?.abort();
    setIsLoading(false);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setErrorMessage(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        handleSelect(results[activeIndex]);
      } else {
        void handleSearch();
      }
      return;
    }

    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }

  };

  return (
    <div className="location-search-container" ref={containerRef}>
      <div className="location-search-input-wrapper">
        <Search className="location-search-icon" size={16} aria-hidden="true" />
        <input
          type="text"
          id={inputId}
          className="location-search-input"
          value={query}
          onChange={(e) => {
            requestControllerRef.current?.abort();
            setIsLoading(false);
            const newValue = e.target.value;
            setQuery(newValue);
            if (!newValue.trim()) resetSearchState();
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label="地点検索"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="location-search-listbox"
          aria-autocomplete="none"
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `${OPTION_ID_PREFIX}${activeIndex}` : undefined
          }
        />
        {!isLoading && query && (
          <button
            type="button"
            className="location-search-clear"
            onClick={handleClear}
            aria-label="検索をクリア"
          >
            <X size={14} />
          </button>
        )}
        <button
          type="button"
          className="location-search-submit"
          disabled={!query.trim() || isLoading || coolingDown}
          aria-label="地点を検索"
          onClick={() => void handleSearch()}
        >
          {isLoading ? <Loader2 className="spin-icon" size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
          <span>検索</span>
        </button>
      </div>

      {isOpen && (
        <ul
          className="location-search-results"
          id="location-search-listbox"
          role="listbox"
          ref={listRef}
        >
          {errorMessage ? (
            <li className="location-search-error">
              <AlertCircle size={14} aria-hidden="true" />
              {errorMessage}
            </li>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <li
                key={result.placeId}
                id={`${OPTION_ID_PREFIX}${index}`}
                className={`location-search-item ${
                  index === activeIndex ? "is-active" : ""
                }`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <MapPin className="location-search-item-icon" size={16} />
                <div className="location-search-item-details">
                  <div className="location-search-item-name">{result.name}</div>
                  <div className="location-search-item-address">{result.addressText}</div>
                </div>
              </li>
            ))
          ) : (
            hasSearched && (
              <li className="location-search-no-results">
                「{query}」に一致する場所が見つかりませんでした
              </li>
            )
          )}
        </ul>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {errorMessage
          ? errorMessage
          : isOpen && hasSearched
            ? `${results.length}件の候補が見つかりました`
            : ""}
      </span>
    </div>
  );
}
