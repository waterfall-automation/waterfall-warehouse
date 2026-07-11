import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Cupboard = {
  Cupboard_ID: string;
  Cupboard_Number: string;
  Name: string;
  Location?: string;
  Type?: string;
  Color?: string;
};

type BoxType = {
  Box_ID: string;
  Cupboard_ID: string;
  Box_Name: string;
};

interface LocationPickerProps {
  cupboards: Cupboard[];
  boxes: BoxType[];
  selectedCupboardId: string;
  selectedBoxId: string;
  onChange: (cupboardId: string, boxId: string) => void;
  onAddNewContainer?: () => void;
  onAddNewBox?: (cupboardId: string) => void;
}

export function LocationPicker({
  cupboards,
  boxes,
  selectedCupboardId,
  selectedBoxId,
  onChange,
  onAddNewContainer,
  onAddNewBox,
}: LocationPickerProps) {
  const [isEditing, setIsEditing] = useState(!selectedCupboardId);
  const [currentView, setCurrentView] = useState<'root' | 'container' | 'box'>('root');
  const [currentCupboardId, setCurrentCupboardId] = useState<string>('');
  const [currentBoxId, setCurrentBoxId] = useState<string>('');

  // Whenever the selection changes from outside, sync editing state
  useEffect(() => {
    if (!selectedCupboardId) {
      setIsEditing(true);
      setCurrentView('root');
      setCurrentCupboardId('');
      setCurrentBoxId('');
    } else {
      setIsEditing(false);
      setCurrentCupboardId(selectedCupboardId);
      setCurrentBoxId(selectedBoxId);
    }
  }, [selectedCupboardId, selectedBoxId]);

  const activeCupboard = cupboards.find(c => c.Cupboard_ID === selectedCupboardId);
  const activeBox = boxes.find(b => b.Box_ID === selectedBoxId);

  // Drill down helpers
  const handleCupboardClick = (cupboardId: string) => {
    setCurrentCupboardId(cupboardId);
    setCurrentView('container');
  };

  const handleBoxClick = (boxId: string) => {
    setCurrentBoxId(boxId);
    setCurrentView('box');
  };

  const handleBack = () => {
    if (currentView === 'box') {
      setCurrentView('container');
    } else if (currentView === 'container') {
      setCurrentView('root');
    }
  };

  const selectDirectly = (cupboardId: string, boxId: string) => {
    onChange(cupboardId, boxId);
    setIsEditing(false);
  };

  // If a location is selected and we are not in editing mode, show the compact breadcrumb label
  if (!isEditing && selectedCupboardId && activeCupboard) {
    const label = activeBox 
      ? `${activeCupboard.Cupboard_Number} / ${activeBox.Box_Name}` 
      : activeCupboard.Cupboard_Number;
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer text-xs group"
      >
        <div className="flex items-center gap-2 min-w-0 mr-2">
          <span className="text-base shrink-0">📍</span>
          <span className="font-semibold text-indigo-950 font-mono truncate">{label}</span>
          {activeCupboard.Location && (
            <span className="text-[10px] text-indigo-700/60 font-medium truncate">({activeCupboard.Location})</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-indigo-600 group-hover:underline shrink-0">Change</span>
      </div>
    );
  }

  // Render the drill-down folder browser picker
  const currentCup = cupboards.find(c => c.Cupboard_ID === currentCupboardId);
  const currentBox = boxes.find(b => b.Box_ID === currentBoxId);
  const boxesInCurrentCup = boxes.filter(b => b.Cupboard_ID === currentCupboardId);

  return (
    <div className="border border-muted-foreground/15 rounded-xl p-3 bg-muted/10 space-y-3 animate-in fade-in duration-200">
      {/* Navigation Header / Breadcrumbs */}
      {currentView !== 'root' && (
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground border-b pb-2 flex-wrap">
          <button 
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 hover:text-foreground text-indigo-600"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <span className="text-[10px] text-muted-foreground/40">|</span>
          <button 
            type="button" 
            onClick={() => { setCurrentView('root'); setCurrentCupboardId(''); }}
            className="hover:text-foreground"
          >
            All Containers
          </button>
          {currentCup && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <button 
                type="button" 
                onClick={() => { setCurrentView('container'); setCurrentBoxId(''); }}
                className={cn("hover:text-foreground font-mono", currentView === 'container' && "text-foreground font-bold")}
              >
                {currentCup.Cupboard_Number}
              </button>
            </>
          )}
          {currentView === 'box' && currentBox && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <span className="text-foreground font-bold truncate max-w-[120px]">{currentBox.Box_Name}</span>
            </>
          )}
        </div>
      )}

      {/* Grid Content */}
      <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
        {currentView === 'root' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {cupboards.map(cup => (
              <button
                key={cup.Cupboard_ID}
                type="button"
                onClick={() => handleCupboardClick(cup.Cupboard_ID)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm text-left transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">
                    {cup.Type === 'Drawer' ? '🗃️' : '🗄️'}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground font-mono leading-tight">{cup.Cupboard_Number}</p>
                    <p className="text-[10px] text-muted-foreground truncate leading-normal">{cup.Name}</p>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
              </button>
            ))}

            {onAddNewContainer && (
              <button
                type="button"
                onClick={onAddNewContainer}
                className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 hover:border-indigo-400 hover:text-indigo-600 transition-all text-xs font-semibold gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Container
              </button>
            )}
          </div>
        )}

        {currentView === 'container' && currentCup && (
          <div className="space-y-2">
            {/* Option to place directly in the container */}
            <button
              type="button"
              onClick={() => selectDirectly(currentCup.Cupboard_ID, '')}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-indigo-500/20 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-500/40 text-left transition-all text-xs font-bold text-indigo-700"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>+ Place directly in container {currentCup.Cupboard_Number}</span>
            </button>

            {/* Boxes list */}
            {boxesInCurrentCup.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {boxesInCurrentCup.map(box => (
                  <button
                    key={box.Box_ID}
                    type="button"
                    onClick={() => handleBoxClick(box.Box_ID)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm text-left transition-all text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">📦</span>
                      <p className="font-semibold text-foreground truncate">{box.Box_Name}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            )}

            {/* Add box option */}
            {onAddNewBox && (
              <button
                type="button"
                onClick={() => onAddNewBox(currentCup.Cupboard_ID)}
                className="w-full flex items-center justify-center p-2 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 hover:border-indigo-400 hover:text-indigo-600 transition-all text-xs font-semibold gap-1.5 mt-2"
              >
                <Plus className="h-4 w-4" /> Add Box to {currentCup.Cupboard_Number}
              </button>
            )}
          </div>
        )}

        {currentView === 'box' && currentCup && currentBox && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => selectDirectly(currentCup.Cupboard_ID, currentBox.Box_ID)}
              className="w-full flex items-center gap-2 p-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-600 text-left transition-all text-xs font-bold text-indigo-700"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>+ Place in box "{currentBox.Box_Name}" of {currentCup.Cupboard_Number}</span>
            </button>
          </div>
        )}
      </div>

      {selectedCupboardId && (
        <div className="flex justify-end pt-1 border-t border-muted-foreground/10">
          <button 
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
          >
            Cancel change
          </button>
        </div>
      )}
    </div>
  );
}
