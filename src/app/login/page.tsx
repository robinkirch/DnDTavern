'use client';

import { useState, FormEvent, useEffect, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Upload, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/context/i18n-context';

// Import the new API service functions
import { checkUsernameExists } from '../../lib/authService';

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL(file.type));
        };
        img.onerror = (error) => reject(error);
    });
};

export default function LoginPage() {
    const [formState, setFormState] = useState<'initial' | 'login' | 'register'>('initial');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'player' | 'dm'>('player');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    // Use both login and register functions from the auth context
    const { login, register, user, loading } = useAuth();
    const { t } = useI18n();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file, 128, 128);
                setAvatarPreview(resizedImage);
            } catch (err) {
                console.error("Failed to resize image", err);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleInitialSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim()) {
            setError(t('Username is required.'));
            return;
        }
        try {
            const { exists } = await checkUsernameExists(username.trim());
            if (exists) {
                setFormState('login');
            } else {
                setFormState('register');
            }
        } catch (err) {
            const error = err as string;
            setError(t('Error {{Error}}', { Error: error }));
        }
    };

    const handleAuthSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!username.trim() || !password.trim()) {
            setError(t('Username and password are required.'));
            return;
        }

        try {
            if (formState === 'login') {
                // Call the specific login function
                await login(username.trim(), password.trim());
            } else if (formState === 'register') {
                // Call the specific register function
                await register(username.trim(), password.trim(), role, avatarPreview);
            }
            router.push('/');
        } catch (err: any) {
            setError(t('Failed to log in or create account. Please try a different username or check your credentials.'));
        }
    };

    const renderFormContent = () => {
        if (formState === 'initial') {
            return (
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">{t('Username')}</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder={t('e.g. Elminster')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="text-base"
                        />
                    </div>
                </CardContent>
            );
        } else {
            return (
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">{t('Username')}</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            readOnly
                            className="text-base font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('Password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t('Secure Password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="text-base"
                        />
                    </div>
                    {formState === 'register' && (
                        <>
                            <div className="space-y-2">
                                <Label>{t('Profile Picture')}</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={avatarPreview ?? undefined} alt="Avatar Preview" />
                                        <AvatarFallback className='bg-muted'>
                                            <UserIcon className="h-8 w-8 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {t('Upload Image')}
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('Role')}</Label>
                                <RadioGroup defaultValue="player" value={role} onValueChange={(value: 'player' | 'dm') => setRole(value)} className="flex gap-4 pt-1">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="player" id="player" />
                                        <Label htmlFor="player" className="font-normal">{t('Player')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="dm" id="dm" />
                                        <Label htmlFor="dm" className="font-normal">{t('Dungeon Master')}</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </>
                    )}
                </CardContent>
            );
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="flex items-center gap-4 mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-primary"><path d="M12 2a5 5 0 0 0-5 5v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-5-5zM9 7a3 3 0 0 1 6 0v2H9V7zm-2 6v2h4v-2H7z"/></svg>
                <h1 className="font-headline text-4xl font-bold text-primary">{t('Tavern Keeper')}</h1>
            </div>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">
                        {formState === 'initial' && t('Welcome, Traveler')}
                        {formState === 'login' && t('Welcome Back')}
                        {formState === 'register' && t('New Traveler')}
                    </CardTitle>
                    <CardDescription>
                        {formState === 'initial' && t('What name do you go by in these parts?')}
                        {formState === 'login' && t('Please enter your password to log in.')}
                        {formState === 'register' && t('A new journey awaits! Please fill in your details.')}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={formState === 'initial' ? handleInitialSubmit : handleAuthSubmit}>
                    {renderFormContent()}
                    {error && <p className="text-sm text-destructive px-6">{error}</p>}
                    <CardFooter className="flex-col gap-2">
                        <Button type="submit" className="w-full">
                            {formState === 'initial' && t('Continue')}
                            {formState === 'login' && t('Enter the Tavern')}
                            {formState === 'register' && t('Join the Journey')}
                        </Button>
                        {formState !== 'initial' && (
                            <Button type="button" variant="ghost" onClick={() => setFormState('initial')} className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                {t('Back')}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </main>
    );
}