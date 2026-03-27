import { Search, Download, Settings, RefreshCw } from 'lucide-react';
import { cn } from '../../App';

interface HeaderProps {
  projectName: string;
  analyzedAt: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ projectName, analyzedAt, searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="h-16 glass border-b border-white/10 flex items-center px-6 gap-6 z-10">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-cyan to-primary-purple flex items-center justify-center neon-cyan">
          <span className="text-xl">🔥</span>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">{projectName}</h1>
          <p className="text-xs text-text-tertiary">
            Analyzed {new Date(analyzedAt).toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-background-medium border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-cyan transition-colors"
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg bg-background-medium border border-white/10 hover:border-primary-cyan transition-colors group">
          <RefreshCw className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
        </button>
        <button className="p-2 rounded-lg bg-background-medium border border-white/10 hover:border-primary-cyan transition-colors group">
          <Download className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
        </button>
        <button className="p-2 rounded-lg bg-background-medium border border-white/10 hover:border-primary-cyan transition-colors group">
          <Settings className="w-4 h-4 text-text-secondary group-hover:text-primary-cyan transition-colors" />
        </button>
      </div>
    </header>
  );
}
