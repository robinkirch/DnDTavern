import React, { useState } from 'react';
import { X, Plus, Check, Ban, Trash2, Scroll, Hammer, Trash2Icon } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';
import './style/questboard.css';

export default function QuestBoard() {
  const [boards, setBoards] = useState([
    {
      id: 1,
      name: "Waterdeep",
      quests: [
        {
          id: 1,
          title: "Ratten im Keller",
          description: "Meine Taverne wird von Riesenratten heimgesucht. Hilfe dringend benötigt!",
          reward: "50 Goldmünzen + Freibier für eine Woche",
          contact: "Durnan, Gastwirt der Yawning Portal",
          image: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400&h=300&fit=crop",
          rotation: -2,
          status: "available",
          pinX: 45,
          pinY: 8
        },
        {
          id: 2,
          title: "Gestohlenes Amulett",
          description: "Ein wertvolles Familienerbstück wurde aus meinem Anwesen gestohlen. Diskrete Ermittlungen erwünscht.",
          reward: "200 Goldmünzen",
          contact: "Lady Cassalanter",
          image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=300&fit=crop",
          rotation: 3,
          status: "available",
          pinX: 50,
          pinY: 5
        },
        {
          id: 3,
          title: "Eskortauftrag nach Neverwinter",
          description: "Suche erfahrene Abenteurer zum Schutz einer Handelskarawane. Reisedauer ca. 10 Tage.",
          reward: "100 GM pro Person + Verpflegung",
          contact: "Handelsmeister Grondor",
          rotation: 1,
          status: "available",
          pinX: 48,
          pinY: 10
        }
      ]
    },
    {
      id: 2,
      name: "Baldur's Gate",
      quests: [
        {
          id: 4,
          title: "Verschollener Schatz",
          description: "Alte Karte führt zu vergrabenem Schatz außerhalb der Stadt. Partner gesucht!",
          reward: "Gleiche Teilung der Beute",
          contact: "Mysteröser Fremder in der 'Elfsong Tavern'",
          rotation: -3,
          status: "available",
          pinX: 52,
          pinY: 7
        }
      ]
    }
  ]);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewQuestForm, setShowNewQuestForm] = useState(null as number | null);
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    reward: "",
    contact: "",
    image: ""
  });

  const addBoard = () => {
    if (newBoardName.trim()) {
      setBoards([...boards, {
        id: Date.now(),
        name: newBoardName,
        quests: []
      }]);
      setNewBoardName("");
      setShowNewBoardForm(false);
    }
  };

  const addQuest = (boardId: number) => {
    if (newQuest.title.trim() && newQuest.description.trim()) {
      setBoards(boards.map(board => {
        if (board.id === boardId) {
          return {
            ...board,
            quests: [...board.quests, {
              id: Date.now(),
              ...newQuest,
              rotation: Math.random() * 8 - 4,
              status: "available",
              pinX: 45 + Math.random() * 10,
              pinY: 5 + Math.random() * 8
            }]
          };
        }
        return board;
      }));
      setNewQuest({ title: "", description: "", reward: "", contact: "", image: "" });
      setShowNewQuestForm(null);
    }
  };

  const updateQuestStatus = (boardId: number, questId: number, status:string) => {
    setBoards(boards.map(board => {
      if (board.id === boardId) {
        return {
          ...board,
          quests: board.quests.map(quest => 
            quest.id === questId ? { ...quest, status } : quest
          )
        };
      }
      return board;
    }));
  };

  const removeQuest = (boardId: number, questId: number) => {
    setBoards(boards.map(board => {
      if (board.id === boardId) {
        return {
          ...board,
          quests: board.quests.filter(quest => quest.id !== questId)
        };
      }
      return board;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-12">
      <div className="flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl text-amber-500 tracking-wider">Gilden-Aushänge</h2>
          <p className="text-slate-500 text-sm mt-1 italic">Ruhm und Gold für diejenigen, die es wagen.</p>
        </div>
        {!showNewBoardForm && (
          <Button onClick={() => setShowNewBoardForm(true)} className="bg-amber-700 hover:bg-amber-600 text-amber-50 gap-2">
            <Plus size={18} /> Neues Board
          </Button>
        )}
      </div>

      {showNewBoardForm && (
        <div className="bg-slate-900 border border-amber-900/40 p-6 rounded-lg flex gap-4 items-center">
          <input
            type="text"
            placeholder="Name der Region..."
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="flex-1 bg-black border border-slate-800 rounded px-4 py-2 text-amber-100 focus:outline-none focus:border-amber-600"
          />
          <Button onClick={addBoard} className="bg-emerald-700">Errichten</Button>
          <Button variant="ghost" onClick={() => setShowNewBoardForm(false)} className="text-slate-500">Abbrechen</Button>
        </div>
      )}

        {showNewQuestForm !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="quest quest-torn w-full max-max-w-md p-8 relative animate-in fade-in zoom-in duration-300">
            <div className="pin" style={{ left: '50%', top: '10px' }}></div>
            <button 
                onClick={() => setShowNewQuestForm(null)}
                className="absolute top-4 right-4 text-amber-900 hover:scale-110 transition-transform"
            >
                <X size={24} />
            </button>

            <h3 className="text-2xl mb-6 border-b border-amber-900/20 pb-2">Neuer Quest-Aushang</h3>
            
            <div className="space-y-4">
                <div>
                <label className="block text-xs uppercase font-bold text-amber-900/60 mb-1">Titel des Abenteuers</label>
                <input
                    type="text"
                    placeholder="z.B. Der Drache vom Eisnadelgipfel"
                    value={newQuest.title}
                    onChange={(e) => setNewQuest({...newQuest, title: e.target.value})}
                    className="w-full bg-amber-900/5 border-b border-amber-900/30 p-2 focus:outline-none focus:border-amber-700 text-amber-950 placeholder:text-amber-900/30"
                />
                </div>

                <div>
                <label className="block text-xs uppercase font-bold text-amber-900/60 mb-1">Beschreibung</label>
                <textarea
                    placeholder="Was ist zu tun?"
                    value={newQuest.description}
                    onChange={(e) => setNewQuest({...newQuest, description: e.target.value})}
                    className="w-full bg-amber-900/5 border-b border-amber-900/30 p-2 focus:outline-none focus:border-amber-700 text-amber-950 h-24 resize-none placeholder:text-amber-900/30"
                />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs uppercase font-bold text-amber-900/60 mb-1">Belohnung</label>
                    <input
                    type="text"
                    placeholder="Gold, Items..."
                    value={newQuest.reward}
                    onChange={(e) => setNewQuest({...newQuest, reward: e.target.value})}
                    className="w-full bg-amber-900/5 border-b border-amber-900/30 p-2 focus:outline-none focus:border-amber-700 text-amber-950 placeholder:text-amber-900/30"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase font-bold text-amber-900/60 mb-1">Bild-URL (optional)</label>
                    <input
                    type="text"
                    placeholder="https://..."
                    value={newQuest.image}
                    onChange={(e) => setNewQuest({...newQuest, image: e.target.value})}
                    className="w-full bg-amber-900/5 border-b border-amber-900/30 p-2 focus:outline-none focus:border-amber-700 text-amber-950 placeholder:text-amber-900/30"
                    />
                </div>
                </div>

                <Button 
                onClick={() => addQuest(showNewQuestForm)}
                className="w-full bg-amber-800 hover:bg-amber-700 text-white mt-6 shadow-lg shadow-amber-900/20"
                >
                Auftrag besiegeln
                </Button>
            </div>
            </div>
        </div>
        )}

      {boards.map(board => (
        <section key={board.id} className="space-y-4">
          <div className="board-4">
            <div className="board-headline">
                <h3 className="text-2xl text-amber-600/90 middle-plate">{board.name}</h3>
                <h3 className="outer-plate">2 / 8</h3>
                <div className="outerouter-plate"><Trash2Icon onClick={undefined}/></div>
            </div>
            <div className="quest-container">
              {board.quests.map(quest => (
                <div
                  key={quest.id}
                  className="quest quest-torn group hover:scale-105 hover:rotate-0 z-10 hover:z-20"
                  style={{ '--rotation': `${quest.rotation}deg`, transform: `rotate(${quest.rotation}deg)` } as React.CSSProperties}
                >
                  <div className="pin" style={{ left: `${quest.pinX}%`, top: `${quest.pinY}px` }}></div>

                  {quest.status === 'completed' && (
                    <div className="absolute inset-0 bg-emerald-900/80 z-20 flex items-center justify-center rounded-sm">
                      <span className="board-headline text-2xl text-white border-4 border-white px-4 py-1 -rotate-12">ERFÜLLT</span>
                    </div>
                  )}
                  {quest.status === 'declined' && (
                    <div className="absolute inset-0 bg-red-950/80 z-20 flex items-center justify-center rounded-sm">
                      <span className="board-headline text-xl text-white border-4 border-white px-4 py-1 -rotate-12">GESCHEITERT</span>
                    </div>
                  )}

                  {quest.image && (
                    <img src={quest.image} className="w-full h-[120px] object-cover rounded-sm mb-3 sepia-[0.3]" alt={quest.title} />
                  )}
                  
                  <h3>{quest.title}</h3>
                  <p className="text-sm text-amber-950/80 leading-snug">{quest.description}</p>
                  
                  {quest.reward && (
                    <div className="reward-style">Belohnung: {quest.reward}</div>
                  )}

                  <div className="mt-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateQuestStatus(board.id, quest.id, 'completed')} className="p-2 bg-emerald-700 text-white rounded flex-1 hover:bg-emerald-600"><Check size={14} className="mx-auto"/></button>
                    <button onClick={() => updateQuestStatus(board.id, quest.id, 'declined')} className="p-2 bg-red-800 text-white rounded flex-1 hover:bg-red-700"><Ban size={14} className="mx-auto"/></button>
                    <button onClick={() => removeQuest(board.id, quest.id)} className="p-2 bg-slate-800 text-white rounded flex-1 hover:bg-slate-700"><Trash2 size={14} className="mx-auto"/></button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowNewQuestForm(board.id)}
                className="w-[280px] h-[350px] border-4 border-dashed border-amber-900/30 rounded-lg flex flex-col items-center justify-center text-amber-900/50 hover:text-amber-600 hover:border-amber-600/50 hover:bg-amber-900/10 transition-all group"
              >
                <Plus size={48} className="group-hover:scale-110 transition-transform" />
                <span className="text-lg mt-2">Auftrag anheften</span>
              </button>
            </div>
          </div>
        </section>
      ))}

      {/* Empty State */}
      {boards.length === 0 && (
        <div className="p-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
          <Hammer className="mx-auto text-slate-800 mb-4" size={64} />
          <p className="text-slate-500 text-xl">Keine Quest-Boards vorhanden</p>
          <Button onClick={() => setShowNewBoardForm(true)} variant="link" className="text-amber-600 mt-2 italic">
            Errichte das erste Aushangbrett
          </Button>
        </div>
      )}
    </div>
  );
}