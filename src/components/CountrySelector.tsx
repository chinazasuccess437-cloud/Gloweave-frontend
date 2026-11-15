import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { ALL_COUNTRIES } from '../data/countries';

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  compact?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select country',
  includeAllOption = false,
  allOptionLabel = 'All Countries',
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [search]);

  const displayLabel = value
    ? includeAllOption && value === 'All'
      ? allOptionLabel
      : value
    : placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full bg-[#040A1A] border border-[#1E386E] flex items-center justify-between gap-2 text-left focus:outline-none focus:border-sky-400 transition cursor-pointer ${
          compact ? 'rounded-lg px-2.5 py-1.5 text-xs' : 'rounded-xl px-3.5 py-2.5 text-xs'
        }`}
      >
        <span className={value ? 'text-slate-100 truncate' : 'text-slate-500 truncate'}>
          {displayLabel}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 min-w-[230px] rounded-xl bg-[#071129] border border-[#1E386E] shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-[#172B54] flex items-center gap-2 bg-[#050C1D]">
            <Search className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country (A–Z)..."
              className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear country search"
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-[#112247]/60">
            {includeAllOption && !search.trim() && (
              <button
                type="button"
                onClick={() => {
                  onChange('All');
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-2 text-xs transition cursor-pointer ${
                  value === 'All'
                    ? 'bg-[#0066FF]/25 text-sky-300 font-semibold'
                    : 'text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {allOptionLabel}
              </button>
            )}

            {filteredCountries.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No country matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition cursor-pointer ${
                    value === country
                      ? 'bg-[#0066FF]/25 text-sky-300 font-semibold'
                      : 'text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
