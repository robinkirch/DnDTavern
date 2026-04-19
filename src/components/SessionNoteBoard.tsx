'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useI18n } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { MDXEditorMethods } from '@mdxeditor/editor';
import { ForwardRefEditor } from './editor/ForwardRefEditor';
import { Session, SessionLog, SessionNote, SessionWithLogs } from '@/lib/types';
import { deleteSession, getFullSessions, getOtherLogs, saveSession, updateSessionNote } from '@/lib/data-service';
import { Button } from './ui/button';
import { PlusCircle, XCircle } from 'lucide-react';
import { SessionFormDialog } from './dialogs/session-form-dialog';
import { useForceUpdate } from '@/hooks/forceUpdate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ActionConfirmDialog, ConfirmDialogData } from './dialogs/ConfirmDialog';

interface SessionNoteBoardProps {
    campaignId: string;
    grimoireId: string | undefined;
}

type TimelineItem = 
  | { type: 'session'; data: SessionWithLogs; timestamp: Date }
  | { type: 'orphaned_logs'; data: SessionLog[]; timestamp: Date };

export function SessionNoteBoard ({ grimoireId, campaignId }: SessionNoteBoardProps) {
  const { user } = useAuth();
  const isDM = user?.role == "dm";
  const { t } = useI18n();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);

  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [forceUpdate, setForceUpdate] = useState<number>(0);

  useEffect(() => {
    const loadData = async () => {
      if (!campaignId || !grimoireId) return;
      try {
        setIsLoading(true);
        const [sessionsData, orphanedLogs] = await Promise.all([
          getFullSessions(grimoireId, campaignId),
          getOtherLogs(grimoireId, campaignId)
        ]);

        const combined: TimelineItem[] = [];

        // 1. Sessions hinzufügen
        sessionsData.forEach(s => {
          combined.push({ type: 'session', data: s, timestamp: new Date(s.date) });
        });

        // 2. Orphaned Logs gruppieren (nach Tag) und hinzufügen
        // Wir gruppieren sie, damit nicht jeder einzelne Log-Eintrag ein Timeline-Item wird
        const logsByDate = orphanedLogs.reduce((acc, log) => {
          const dateStr = new Date(log.time).toDateString();
          if (!acc[dateStr]) acc[dateStr] = [];
          acc[dateStr].push(log);
          return acc;
        }, {} as Record<string, SessionLog[]>);

        Object.entries(logsByDate).forEach(([dateStr, logs]) => {
          combined.push({ 
            type: 'orphaned_logs', 
            data: logs, 
            timestamp: new Date(dateStr) 
          });
        });

        // 3. Alles absteigend sortieren
        combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setTimeline(combined);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [campaignId, grimoireId, forceUpdate]);

  const handleUpdateNote = async (sessionId: string, newMarkdown: string, noteId?: string) => {
    if (!grimoireId) return;
    try {
     await updateSessionNote(grimoireId, sessionId, {
        id: noteId,
        note: newMarkdown
      });
      
      toast({ 
        title: t('Note Saved'), 
        description: t('Changes have been synchronized.'),
      });
    } catch (error) {
      toast({ 
        title: t('Error'), 
        variant: 'destructive' 
      });
    }
  };

  const handleSaveSession = async (sessionData: Omit<Session, 'id' | 'campaignId' | 'note' | 'logs'>) => {
    if (!user || !grimoireId) return;

    try {
      const SessionToSave: Session = 
      { 
        id: null, 
        campaignId: campaignId,
        ...sessionData 
      } as Session;

      await saveSession(grimoireId, campaignId, SessionToSave);
      setFormOpen(false);
      setForceUpdate(forceUpdate+1);
      toast({ title: t('Session Added') });
    } catch (error) {
        toast({ title: t('Error'), variant: 'destructive' });
    }
  };

  const [confirmData, setConfirmData] = useState<ConfirmDialogData>({isOpen: false,title: '',description: '', errorDescription: null, successTitle:'', onConfirm: null,onClose: () => setConfirmData(prev => ({ ...prev, isOpen: false }))});
  const showConfirm = (title: string, description: string, successTitle: string, action: () => void, errorDescription?: string | null, successDescription?: string | null) => {
    setConfirmData(prev => ({
      ...prev,
      isOpen: true,
      title,
      description,
      successTitle,
      onConfirm: action,
      errorDescription: errorDescription ?? null,
      successDescription: successDescription ?? null,
    }));
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user || !grimoireId) return;
    showConfirm(
      t('Delete Session'),
      t('Are you sure you want to remove this session and unparent all Logs?'),
      t('Session deleted'),
      async () => {
        await deleteSession(grimoireId, sessionId);
        setForceUpdate(forceUpdate+1);
      }
    );
  }

  if (isLoading) return <div className="p-10 text-white animate-pulse">{t("Loading data...")}</div>;
  if (error) return <div className="p-10 text-red-500">{error}</div>;

  
return (
    <div>
      <SessionFormDialog 
          isOpen={isFormOpen}
          onOpenChange={setFormOpen}
          onSave={handleSaveSession}
      />

      <ActionConfirmDialog  data={confirmData} />

      {isDM && <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
            <h3 className="font-headline text-2xl">{t("Session")}</h3>
            <Button onClick={() => setFormOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4"/> {t("Create Session")}
            </Button>
        </div>
      </div> }

      <div className="sessions-container space-y-12">
        {timeline.map((item, index) => {
          if (item.type === 'session') {
            const session = item.data;
            return (
              <div key={`session-${session.id}`} className="session-block border-b border-white/10 pb-12">
                <div className="flex justify-between items-center">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                      {t("Session")} {session.number}: {session.name}
                    </h2>
                    <p className="text-white/40 text-sm italic">{t("Session on")} {session.date.toLocaleDateString()}</p>
                  </div>
                  <Button variant="destructive" onClick={() => handleDeleteSession(session.id!)}>
                    <XCircle className="mr-2 h-4 w-4"/> {t("Delete Session")}
                  </Button>
                </div>
                
                <div className={`flex flex-col ${isDM ? 'lg:flex-row' : ''} gap-8`}>
                <div className={`${isDM ? 'lg:w-1/2' : 'w-full'}`}>
                  <h3 className="text-xs uppercase text-white/30 font-bold mb-3 tracking-widest">
                    {t("Session Notes")}
                  </h3>
                  
                  {isDM ? (
                    <div className="glass-container rounded-xl overflow-hidden border border-white/10">
                      <SessionEditorBlock
                        key={session.id}
                        initialNote={session.note}
                        onSave={handleUpdateNote}
                      />
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none p-6 bg-white/5 rounded-xl border border-white/5 shadow-inner">
                      {session.note.note ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {session.note.note}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-white/20 italic">
                          {t("Currently there are no session notes")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {isDM && (
                  <div className="lg:w-1/2">
                    <h3 className="text-xs uppercase text-white/30 font-bold mb-3 tracking-widest">
                      {t("Event Log")}
                    </h3>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {session.logs.slice().sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((log) => (
                          <SessionLogDisplay key={log.id} log={log} />
                        ))
                      }
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          } else {
            if (!isDM) return null; 

            return (
              <div key={`orphaned-${item.timestamp.getTime()}`} className="orphaned-block ml-auto w-full lg:w-1/2 pl-8 border-l border-dashed border-white/20 py-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                    {t("Between-Logs:")} {item.timestamp.toLocaleDateString()}
                  </span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div className="space-y-2">
                  {item.data.slice().sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).map((log) => (
                      <SessionLogDisplay key={log.id} log={log} />
                    ))
                  }
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default SessionNoteBoard;


interface SessionEditorBlockProps {
  initialNote: SessionNote;
  onSave: (sessionId: string, markdown: string, noteId?: string) => Promise<void>
}

function SessionEditorBlock({initialNote, onSave }: SessionEditorBlockProps) {
  const [localMarkdown, setLocalMarkdown] = useState(initialNote.note);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (localMarkdown === initialNote.note) return;

    const timer = setTimeout(() => {
      onSave(initialNote.sessionId, localMarkdown, initialNote.id);
    }, 7000);

    return () => clearTimeout(timer);
  }, [localMarkdown]);

  return (
    <div className="glass-container rounded-xl overflow-hidden border border-white/10">
      <ForwardRefEditor
        markdown={localMarkdown}
        onChange={setLocalMarkdown}
      />
    </div>
  );
}

function SessionLogDisplay({ log }: { log: SessionLog }) {

  const levelStyles: Record<string, string> = {
    Critical: "text-red-400 border-red-500/50",
    Error: "text-orange-400 border-orange-500/50",
    Warning: "text-yellow-400 border-yellow-500/50",
    Information: "text-green-400 border-green-500/50",
    Success: "text-green-400 border-green-500/50",
  };

  const currentStyle = levelStyles[log.logLevel] || "bg-white/10 text-white/60 border-white/10";

  return (
    <div className={`text-sm p-3 rounded bg-white/5 border-l-4 ${currentStyle} flex flex-col transition-all hover:bg-white/[0.07]`}>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-black/20">
          {log.logLevel}
        </span>
        <span className="text-[10px] text-white/20 font-mono">
          {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-white/80 leading-relaxed">{log.message}</p>
      <span className="text-[10px] text-white/20 mt-1 self-end">— {log.userName}</span>
    </div>
  );
}