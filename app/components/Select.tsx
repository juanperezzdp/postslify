import React, { useState, useEffect, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faSearch, faCheck } from "@fortawesome/free-solid-svg-icons";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  className = "",
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full cursor-pointer rounded-xl border bg-slate-50 px-4 py-3 text-left text-sm font-medium transition-all outline-none
          ${isOpen 
            ? "border-blue-500 ring-4 ring-blue-500/10 bg-white" 
            : "border-slate-200 hover:border-blue-300 focus:border-blue-500"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}
        `}
      >
        <span className={`block truncate ${selectedOption ? "text-slate-900" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
          <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <FontAwesomeIcon icon={faSearch} className="h-3.5 w-3.5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="block w-full rounded-xl border-0 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500/20 sm:text-sm sm:leading-6 outline-none"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-slate-500">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    relative w-full cursor-pointer select-none rounded-lg py-2.5 pl-3 pr-9 text-left text-sm transition-colors
                    ${value === option.value 
                      ? "bg-blue-50 text-blue-700 font-medium" 
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"}
                  `}
                >
                  <span className="block truncate">{option.label}</span>
                  {value === option.value && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                      <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
