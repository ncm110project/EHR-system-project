"use client";

import { useState, useMemo } from 'react';

interface SearchFilterProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (selected: string[]) => void;
  results?: number;
  showResults?: boolean;
}

interface FilterOption {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

export function SearchFilter({ 
  placeholder = 'Search...', 
  onSearch,
  filters = [],
  onFilterChange,
  results,
  showResults = true
}: SearchFilterProps) {
  const [query, setQuery] = useState('');
  const [expandedFilters, setExpandedFilters] = useState<string[]>([]);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const toggleFilter = (filterId: string) => {
    setExpandedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        {showResults && typeof results === 'number' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {results} results
          </span>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <div key={filter.id} className="relative">
              <button
                onClick={() => toggleFilter(filter.id)}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{filter.label}</span>
                <svg className={`w-4 h-4 transition-transform ${expandedFilters.includes(filter.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedFilters.includes(filter.id) && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-2 min-w-[150px]">
                  {filter.options.map(option => (
                    <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" className="rounded text-teal-600" />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DateFilterProps {
  label?: string;
  onChange?: (start: string, end: string) => void;
}

export function DateFilter({ label = 'Date Range', onChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = () => {
    onChange?.(startDate, endDate);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4 w-64">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-600">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm text-slate-600">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleApply} className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Apply</button>
              <button onClick={() => { setStartDate(''); setEndDate(''); onChange?.('', ''); }} className="px-3 py-2 border rounded-lg text-sm hover:bg-slate-50">Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for filtering data
export function useFilteredData<T>(data: T[], searchFields: (keyof T)[], query: string) {
  return useMemo(() => {
    if (!query.trim()) return data;
    
    const lowerQuery = query.toLowerCase();
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(lowerQuery);
      })
    );
  }, [data, searchFields, query]);
}