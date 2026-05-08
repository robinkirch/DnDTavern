'use client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Languages, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useI18n } from '@/context/i18n-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserProfileDialog } from './dialogs/userprofile-modal';
import { useState } from 'react';
import { UserDTO } from '@/lib/types';
import { updateUser } from '@/lib/data-service';
import { toast } from '@/hooks/use-toast';


interface HeaderProps {
    helpText?: string;
}

export function Header({ helpText }: HeaderProps) {
  const { user, logout, login } = useAuth();
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleUpdateProfile = async (values: UserDTO) => {
    try {
      await updateUser(values);
      const loginPassword = values.newPassword && values.newPassword.trim() !== '' ? values.newPassword : values.oldPassword;

      await login(values.newUsername, loginPassword);

      toast({ title: t('Profile updated'), description: t('Your changes have been saved and you have been re-authenticated.') });

    } catch (error: any) {
      const message = error.message || 'Update failed';

      if (message.toLowerCase().includes('password') || message.toLowerCase().includes('taken')) {
        throw error; 
      } 
      toast({ title: t('Error'), description: t(message), variant: 'destructive'});
      throw error; 
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const TankardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h2" />
        <path d="M14 9V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4" />
        <path d="M18 11v10" />
    </svg>
  );

  const hasEmptyCharacterName = user?.characterData ? Object.values(user.characterData).some(data => !data.characterName || data.characterName.trim() === '') : false;
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
     <TooltipProvider>
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-3">
            <TankardIcon className="h-7 w-7 text-primary" data-ai-hint="tankard" />
            <span className="font-headline text-xl font-bold text-primary hidden sm:inline-block">{t('Tavern Keeper')}</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
           {helpText && (
               <Tooltip>
                 <TooltipTrigger asChild>
                   <Button variant="ghost" size="icon" className='h-9 w-9 text-muted-foreground'>
                     <Info className="h-4 w-4" />
                     <span className="sr-only">{t('Help')}</span>
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" align="end" className="max-w-xs">
                   <p>{helpText}</p>
                 </TooltipContent>
               </Tooltip>
           )}
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className='h-9 w-9'>
                  <Languages className="h-4 w-4" />
                  <span className="sr-only">{t('Change language')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as 'en' | 'de')}>
                  <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
         {user && (
            <>
              <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => setIsProfileOpen(true)}
              >
                {/* Relative Container für das Badge */}
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.username} />
                    <AvatarFallback>
                      <UserIcon className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Das blinkende Ausrufezeichen */}
                  {hasEmptyCharacterName && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black shadow-sm animate-pulse border-2 border-background">
                      !
                    </span>
                  )}
                </div>

                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  {user.username}
                </span>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">{t('Logout')}</span>
              </Button>

              <UserProfileDialog 
                user={user} 
                isOpen={isProfileOpen} 
                onOpenChange={setIsProfileOpen} 
                onSave={handleUpdateProfile}
              />
            </>
          )}
        </div>
      </div>
      </TooltipProvider>
    </header>
  );
}
