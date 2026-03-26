import React, { useEffect, useState } from 'react';
import { X, Plus, Ban, Trash2, Hammer, Trash2Icon, Handshake, CircleCheck } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';
import './style/questboard.css';
import { Quest, Questboard } from '@/lib/types';
import { getAllQuestBoards, addQuestBoard, deleteQuestboard, addQuest, updateQuest, deleteQuest } from '@/lib/data-service';
import { useI18n } from '@/context/i18n-context';
import { ActionConfirmDialog, ConfirmDialogData } from './ConfirmDialog';

interface QuestboardProps {
    campaignId: string;
    grimoireId: string | undefined;
}


const getVisualsFromId = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
        rotation: (hash % 10) - 5, // -5 bis +5
        pinX: (hash % 20) + 40,    // 40 bis 60
        pinY: (hash % 10) + 5      // 5 bis 15
    };
};

export default function QuestBoard({ campaignId, grimoireId }: QuestboardProps) {
    const { t } = useI18n();
    const [boards, setBoards] = useState<Questboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewBoardForm, setShowNewBoardForm] = useState(false);
    const [newBoardName, setNewBoardName] = useState("");
    const [showNewQuestForm, setShowNewQuestForm] = useState<string | null>(null);

    const enrichQuest = (quest: Quest) => {
        const visuals = getVisualsFromId(quest.id);
        return {
            ...quest,
            ...visuals
        };
    };

    const displayQuestType = (questType: 'guild' | 'personal' | 'main' | 'other') => {
        if (questType == 'other')
            return <></>;
        
        const color = questType == 'guild' ? "bg-violet-500" : questType == 'personal' ? "bg-teal-500" : questType == 'main' ? "bg-amber-500" : "";
        const title = questType == 'guild' ? t('guild') : questType == 'personal' ? t('personal') : questType == 'main' ? t('main') : "";
        return (
            <span className={`${color} px-2 py-0.5 rounded-full text-black text-xs`}>{title}</span>
        );
    }

    const [newQuestData, setNewQuestData] = useState({
        questBoardId: "",
        name: "",
        description: "",
        type: 'guild',
        reward: "",
        status: 'none' as const,
    });

    const fetchQuests = async () => {
        try {
            setLoading(true);
            const data = await getAllQuestBoards(grimoireId!, campaignId);
            const enrichedBoards = data.map(board => ({
                ...board,
                quests: board.quests.map(enrichQuest)
            }));
            setBoards(enrichedBoards);
        } catch (error) {
            toast({ title: "Fehler", description: t("Questboard could not be loaded"), variant: "destructive" });
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (grimoireId && campaignId) fetchQuests();
    }, [grimoireId, campaignId]);


    const addBoard = async () => {
        if (!newBoardName.trim()) return;

        try {
          const boardData: Partial<Questboard> = {
              cityName: newBoardName,
              campaignId: campaignId,
          };

          await addQuestBoard(grimoireId!, campaignId, boardData as Questboard);
          
          await fetchQuests(); 
          setNewBoardName("");
          setShowNewBoardForm(false);
          toast({ title: "Erfolg", description: t("Questboard ({{0}}) was added", { 0: newBoardName}) });
          fetchQuests();
      } catch (error) {
          toast({ title: "Fehler", description: t("Questboard could not be added"), variant: "destructive" });
      }
    };

    const [confirmBoardData, setConfirmBoardData] = useState<ConfirmDialogData>({isOpen: false,title: '',description: '', errorDescription: null, successTitle:'', onConfirm: null,onClose: () => setConfirmBoardData(prev => ({ ...prev, isOpen: false }))});
    const showBoardConfirm = (title: string, description: string, successTitle: string, action: () => void, errorDescription?: string | null, successDescription?: string | null) => {
        setConfirmQuestData(prev => ({
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

    const deleteBoard = async (board: Questboard) => {
        var name = board.cityName;
        showBoardConfirm(
            t('Delete Questboard'),
            t('Are you sure you want to remove this board and all quests?'),
            t("Success"),
            async () => {
                await deleteQuestboard(grimoireId!, campaignId, board.id);
                fetchQuests();
            },
            t("Questboard could not be deleted"),
            t("Questboard ({{0}}) was deleted", { 0: name})
        ); 
      };



    const handleAddQuest = async (boardId: string) => {
        if (!newQuestData.name.trim()) {
            toast({ title: t("Error"), description: t("The name field must not be left blank"), variant: "destructive" });
            return;
        }

        try {
            const questToCreate: Partial<Quest> = {
                questBoardId: boardId,
                name: newQuestData.name,
                description: newQuestData.description,
                reward: newQuestData.reward,
                type: newQuestData.type as 'guild' |'personal' | 'main' | 'other',
                status: 'none'
            };

            await addQuest(grimoireId!, boardId, questToCreate as Quest);

            toast({ title: t("Success"), description: t("The quest has been posted on the questboard") });
            
            setShowNewQuestForm(null);
            setNewQuestData({ questBoardId: "", name: "", description: "", reward: "", type: 'guild', status: 'none' });
            
            // Daten neu laden
            fetchQuests();
        } catch (error) {
            toast({ title: t("Error"), description: t("The quest could not be created"), variant: "destructive" });
        }
    };

    // 1. Quest als erledigt markieren
    const handleStatusChangeQuest = async (quest: Quest, newStatus : 'accepted' | 'declined' | 'done') => {
        try {
            const updatedQuest = { ...quest, status: newStatus };

            await updateQuest(grimoireId!, quest.questBoardId, updatedQuest);
            toast({ title: t("Quest updated"), description: t("Quest was changed successfully") });
            fetchQuests(); // Liste neu laden
        } catch (error) {
            toast({ title: t("Error"), description: t("Status could not be updated"), variant: "destructive" });
        }
    };


    const [confirmQuestData, setConfirmQuestData] = useState<ConfirmDialogData>({isOpen: false,title: '',description: '', errorDescription: null, successTitle:'', onConfirm: null,onClose: () => setConfirmQuestData(prev => ({ ...prev, isOpen: false }))});
    const showQuestConfirm = (title: string, description: string, successTitle: string, action: () => void, errorDescription?: string | null, successDescription?: string | null) => {
        setConfirmQuestData(prev => ({
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

    const handleDeleteQuest = async (quest: Quest) => {
        showQuestConfirm(
            t('Delete Quest'),
            t('Are you sure you want to remove this quest?'),
            t("Quest deleted"),
            async () => {
                await deleteQuest(grimoireId!, quest.questBoardId, quest.id);
                fetchQuests();
            },
            t("The quest could not be deleted"),
            t("The quest was torn from the board.")

        );    
      };



    if (loading) return <div className="p-20 text-center text-amber-500">{t("Load Quest information")}...</div>;

    return (
        <>
        <ActionConfirmDialog  data={confirmQuestData} />
        <ActionConfirmDialog  data={confirmBoardData} />

        <div className="min-h-screen p-8 space-y-12">
            {/* Header */}
            <div className="flex justify-between items-end border-b pb-6">
                <div>
                    <h2 className="text-4xl text-amber-500 tracking-wider">{t('Guild Quests')}</h2>
                    <p className="text-slate-500 text-sm mt-1 italic">{t('Fame and fortune for those who dare.')}</p>
                </div>
                {!showNewBoardForm && (
                    <Button onClick={() => setShowNewBoardForm(true)} className="bg-amber-700 hover:bg-amber-600 text-amber-50 gap-2">
                        <Plus size={18} /> {t("New Board")}
                    </Button> //todo above
                )}
            </div>

            {/* Neues Board Formular */}
            {showNewBoardForm && (
                <div className="border border-amber-900/40 p-6 rounded-lg flex gap-4 items-center animate-in slide-in-from-top duration-300">
                    <input
                        type="text"
                        placeholder={t('Name of the city or region (e.g. Waterdeep)...')}
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        className="flex-1 rounded px-4 py-2 text-amber-100 focus:outline-none focus:border-amber-600"
                        style={{backgroundColor: "#251e18", color: "white", border: "1px solid #4d3f33"}}
                    />
                    <Button onClick={addBoard} className="bg-emerald-700 hover:bg-emerald-600">{t('Create')}</Button>
                    <Button variant="ghost" onClick={() => setShowNewBoardForm(false)} className="text-slate-500">{t('Cancel')}</Button>
                </div>
            )}

            {showNewQuestForm !== null && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="quest quest-torn w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-300 bg-[#f4e4bc] text-amber-950">
                        
                        <button 
                            onClick={() => setShowNewQuestForm(null)}
                            className="absolute top-4 right-4 text-amber-900/50 hover:text-amber-900 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Pin-Deko oben mitte */}
                        <div className="pin" style={{ left: '50%', top: '10px' }}></div>
                        
                        <h3 className="text-2xl mb-6 border-b border-amber-900/20 pb-2 font-serif">{t('New Quest')}</h3>
                        
                        <div className="space-y-4">
                            {/* Titel */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest opacity-60">{t('Quest title')}</label>
                                <input
                                    placeholder="z.B. Die Ratten im Keller..." //TODO
                                    value={newQuestData.name}
                                    onChange={(e) => setNewQuestData({...newQuestData, name: e.target.value})}
                                    className="w-full bg-transparent border-b border-amber-900/30 p-2 outline-none focus:border-amber-700 text-lg"
                                />
                            </div>
                            
                            {/* 2. Typ-Dropdown */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest opacity-60">{t('Category')}</label>
                                <select 
                                    value={newQuestData.type}
                                    onChange={(e) => setNewQuestData({...newQuestData, type: e.target.value as Quest['type']})}
                                    className="w-full bg-transparent border-b border-amber-900/30 p-2 outline-none focus:border-amber-700 cursor-pointer appearance-none"
                                >
                                    <option value="guild">{t('guild')}</option>
                                    <option value="main">{t('main')}</option>
                                    <option value="personal">{t('personal')}</option>
                                    <option value="other">{t('other')}</option>
                                </select>
                            </div>

                            {/* Beschreibung */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest opacity-60">{t('Details')}</label>
                                <textarea
                                    placeholder={t('What needs to be done? Who is the client?')}
                                    value={newQuestData.description || ""}
                                    onChange={(e) => setNewQuestData({...newQuestData, description: e.target.value})}
                                    className="w-full bg-transparent border-b border-amber-900/30 p-2 outline-none focus:border-amber-700 h-24 resize-none leading-tight"
                                />
                            </div>

                            {/* Belohnung */}
                            <div className="space-y-1">
                                <label className="text-xs uppercase tracking-widest opacity-60">{t('Reward')}</label>
                                <input
                                    placeholder={t('Gold, items or fame...')}
                                    value={newQuestData.reward}
                                    onChange={(e) => setNewQuestData({...newQuestData, reward: e.target.value})}
                                    className="w-full bg-transparent border-b border-amber-900/30 p-2 outline-none focus:border-amber-700 italic"
                                />
                            </div>

                            <Button 
                                onClick={() => handleAddQuest(showNewQuestForm)}
                                className="w-full bg-amber-900 hover:bg-amber-800 text-amber-50 mt-6 shadow-md py-6 text-lg font-serif"
                            >
                                {t('Quest pinned')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {/* Boards Liste */}
            {boards.map(board => (
                <section key={board.id} className="space-y-4">
                    <div className="board-4">
                        <div className="board-headline" style={{top: "-22px !important"}}>
                            <h3 className="text-2xl text-amber-600/90 middle-plate">{board.cityName}</h3>
                            <h3 className="outer-plate">{board.quests?.length} {board.quests?.length == 1 && t('Order')} {board.quests?.length != 1 && t('Orders')}</h3>
                            <div className="outerouter-plate cursor-pointer hover:text-red-500 transition-colors">
                                <Trash2Icon size={18} onClick={() => deleteBoard(board) }/>
                            </div>
                        </div>
                        
                        <div className="quest-container">
                            {board.quests?.map((quest: any) => (
                                <div
                                    key={quest.id}
                                    className="quest quest-torn group hover:scale-105 hover:rotate-0 z-10 hover:z-20"
                                    style={{ minHeight: "450px", transform: `rotate(${quest.rotation}deg)`,'--rotation': `${quest.rotation}deg` } as React.CSSProperties}
                                >
                                    <div className="pin" style={{ left: `${quest.pinX}%`, top: `${quest.pinY}px` }}></div>

                                    {/* Status Overlays */}
                                    {quest.status !== 'none' && (
                                        <div 
                                            className={`absolute top-4 right-2 w-10 h-10 rounded-full flex items-center justify-center z-30 shadow-lg animate-in zoom-in duration-300 ${
                                                quest.status === 'done' || quest.status === 'accepted' 
                                                    ? "bg-emerald-600 text-white" 
                                                    : "bg-red-700 text-white"
                                            }`}
                                            title={quest.status === 'accepted' ? t('Accepted') : quest.status === 'done' ? t('Done') : t('Declined')}
                                        >
                                            {quest.status === 'accepted' && <Handshake size={20} />}
                                            {quest.status === 'done' && <CircleCheck size={20} />}
                                            {quest.status === 'declined' && <Ban size={20} />}
                                        </div>
                                    )}

                                    <h3>{quest.name}</h3>
                                    <>{displayQuestType(quest.type)}</>
                                    <p className="text-sm text-amber-950/80 leading-snug line-clamp-4">{quest.description}</p>
                                    
                                    {quest.reward && (
                                        <div className="reward-style mt-2" style={{
                                            bottom: "50px",
                                            position: "absolute",
                                            width: "80%"}}>
                                            {t('Reward')}: {quest.reward}</div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"style={{bottom: "15px", position: "absolute", width: "80%"}}>
                                        {quest.status == 'none' &&
                                            <>
                                                <button className="p-2 bg-emerald-700 text-white rounded flex-1 hover:bg-emerald-600" onClick={() => handleStatusChangeQuest(quest, "accepted")}><Handshake size={14} className="mx-auto"/></button>
                                                <button className="p-2 bg-red-800 text-white rounded flex-1 hover:bg-red-700" onClick={() => handleStatusChangeQuest(quest, "declined")}><Ban size={14} className="mx-auto"/></button>
                                            </>
                                        }
                                        {quest.status == 'done' &&
                                            <button className="p-2 bg-emerald-700 text-white rounded flex-1 hover:bg-emerald-600" onClick={() => handleStatusChangeQuest(quest, "done")}><CircleCheck size={14} className="mx-auto"/></button>
                                        }
                                        <button className="p-2 bg-slate-800 text-white rounded flex-1 hover:bg-slate-700" onClick={() => handleDeleteQuest(quest)}><Trash2 size={14} className="mx-auto"/></button>
                                    </div>
                                </div>
                            ))}

                            {/* Neue Quest Button */}
                            <button
                                onClick={() => setShowNewQuestForm(board.id)}
                                className="w-[280px] h-[350px] border-4 border-dashed border-amber-900/30 rounded-lg flex flex-col items-center justify-center text-amber-900/50 hover:text-amber-600 hover:border-amber-600/50 hover:bg-amber-900/10 transition-all group"
                            >
                                <Plus size={48} className="group-hover:scale-110 transition-transform" />
                                <span className="text-lg mt-2">{t('Quest pinned')}</span>
                            </button>
                        </div>
                    </div>
                </section>
            ))}

            {/* Empty State */}
            {boards.length === 0 && (
                <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <Hammer className="mx-auto text-slate-800 mb-4" size={64} />
                    <p className="text-slate-500 text-xl"> {t('No quest boards available')}</p>
                    <Button onClick={() => setShowNewBoardForm(true)} variant="link" className="text-amber-600 mt-2 italic">
                        {t('Set up the first questboard')}
                    </Button>
                </div>
            )}
        </div>
        </>
    );
}