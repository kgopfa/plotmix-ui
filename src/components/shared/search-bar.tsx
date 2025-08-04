'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Search...", 
  onSearch,
  className = ""
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('search') as string;
    onSearch?.(searchQuery);
  };

  return (
    <form action="#" method="GET" className={`grid flex-1 grid-cols-1 ${className}`} onSubmit={handleSubmit}>
      <input
        name="search"
        type="search"
        placeholder={placeholder}
        aria-label="Search"
        className="col-start-1 row-start-1 block size-full bg-white pl-8 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm/6"
      />
      <Search
        aria-hidden="true"
        className="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400"
      />
    </form>
  );
}; 