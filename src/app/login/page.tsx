'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'player' | 'dm'>('player');
  const router = useRouter();
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim(), role);
      router.push('/');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="flex items-center gap-4 mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary"><path d="M12 2a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5zM9 7a3 3 0 0 1 6 0v2H9V7zm-2 6v2h4v-2H7z"/></svg>
        <h1 className="font-headline text-4xl font-bold text-primary">D&D Tavern Keeper</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Welcome, Traveler</CardTitle>
          <CardDescription>What name do you go by in these parts, and what is your role?</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. Elminster"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
                <Label>Role</Label>
                <RadioGroup defaultValue="player" value={role} onValueChange={(value: 'player' | 'dm') => setRole(value)} className="flex gap-4 pt-1">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="player" id="player" />
                        <Label htmlFor="player" className="font-normal">Player</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dm" id="dm" />
                        <Label htmlFor="dm" className="font-normal">Dungeon Master</Label>
                    </div>
                </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Enter the Tavern</Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
