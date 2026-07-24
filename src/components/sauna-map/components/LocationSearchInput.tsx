"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, MapPin } from "lucide-react";
import { searchLocation, GeocodingResult } from "../utils/geocoding";

interface LocationSearchInputProps {
  onSelectLocation: (result: GeocodingResult) => void;
  placeholder?: string;
}

export function LocationSearchInput({
  onSelectLocation,
  placeholder = "施設名や住所で場所を検索...",
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search API call
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const data = await searchLocation(trimmed, controller.signal);
        setResults(data);
        setIsOpen(true);
        setHasSearched(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: GeocodingResult) => {
    onSelectLocation(result);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="location-search-container" ref={containerRef}>
      <div className="location-search-input-wrapper">
        <Search className="location-search-icon" size={16} aria-hidden="true" />
        <input
          type="text"
          className="location-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label="地点検索"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="location-search-listbox"
          aria-autocomplete="list"
        />
        {isLoading && <Loader2 className="location-search-spinner spin" size={16} />}
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
      </div>

      {isOpen && (
        <ul className="location-search-results" id="location-search-listbox" role="listbox">
          {results.length > 0 ? (
            results.map((result) => (
              <li
                key={result.placeId}
                className="location-search-item"
                role="option"
                aria-selected="false"
                onClick={() => handleSelect(result)}
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
    </div>
  );
}
