import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthTracking } from '@/hooks/useAuthTracking';
import { User, LogOut, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserDropdownProps {
  userName: string | null;
  avatarUrl?: string | null;
  onSignOut?: () => void;
}

export const UserDropdown = ({ userName, avatarUrl, onSignOut }: UserDropdownProps) => {
  const navigate = useNavigate();
  const { trackLogout } = useAuthTracking();

  const handleSignOut = async () => {
    trackLogout();
    await supabase.auth.signOut();
    onSignOut?.();
    navigate('/');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px]"
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={avatarUrl || undefined} alt={userName || 'User avatar'} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-sm text-muted-foreground max-w-[100px] truncate">
            {userName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => navigate('/profile')}
          className="cursor-pointer min-h-[44px]"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => navigate('/my-symbols')}
          className="cursor-pointer min-h-[44px]"
        >
          <Settings className="mr-2 h-4 w-4" />
          My Symbols
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive min-h-[44px]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};