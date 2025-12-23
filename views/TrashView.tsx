
import React, { useState, useMemo } from 'react';
import { Icons } from '../constants';
import { DriveItem, SortKey, SortOrder } from '../types';
import { useRecycleBin, useRecycleMutations } from '../hooks/useDriveQueries';
import { GridView } from '../components/drive/GridView';
import { ListView } from '../components/drive/ListView';
import { SelectionBar } from '../components/drive/SelectionBar';
import { DeleteModal } from '../components/overlays/Modals';

interface TrashViewProps {
  searchQuery: string;
  viewMode: 'grid' | 'list';
}

export const TrashView: React.FC<TrashViewProps> = ({ searchQuery, viewMode }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeModal, setActiveModal] = useState<'clear' | 'delete-permanent' | null>(null);
  const [targetItem, setTargetItem] = useState<DriveItem | null>(null);

  const { data: items = [], isLoading } = useRecycleBin(searchQuery);
  const { permanentlyDelete, clearBin } = useRecycleMutations();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const valA = a[sortKey] || '';
      const valB = b[sortKey] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortKey, sortOrder]);

  const handleConfirmClear = () => {
    clearBin.mutate(undefined, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setActiveModal(null);
      }
    });
  };

  const handleConfirmPermanentDelete = () => {
    const ids = selectedIds.size > 0 ? [...selectedIds] : (targetItem ? [targetItem.id] : []);
    // Note: The API technically supports one ID at a time in the query param or clearing all.
    // If the server handles one ID, we iterate. If it handles multiple, we'd adjust.
    // Based on API.md: DELETE /api/recycle-bin?id=xxx
    Promise.all(ids.map(id => permanentlyDelete.mutateAsync(id))).then(() => {
      setSelectedIds(new Set());
      setActiveModal(null);
    });
  };

  return (
    <div className="flex flex-col h-full" onClick={() => selectedIds.size > 0 && setSelectedIds(new Set())}>
      <div className="p-4 md:p-6 pb-2">
        <button 
          onClick={() => setActiveModal('clear')} 
          disabled={items.length === 0}
          className="flex items-center space-x-2 bg-red-600 text-white px-3 md:px-4 py-2 hover:bg-black transition-colors border-2 border-black text-[10px] md:text-xs font-bold uppercase disabled:opacity-30"
        >
          <Icons.Trash className="w-3 h-3" /><span>Empty Trash</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Icons.Grid className="w-10 h-10 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 uppercase font-bold italic">Recycle Bin is Empty</div>
        ) : viewMode === 'grid' ? (
          <GridView 
            items={sortedItems} selectedIds={selectedIds}
            onItemClick={(item) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}
            onItemLongPress={() => {}} onContextMenu={() => {}}
            onRename={() => {}} onMove={() => {}}
            onDelete={(item) => { setTargetItem(item); setActiveModal('delete-permanent'); }}
          />
        ) : (
          <ListView 
            items={sortedItems} selectedIds={selectedIds}
            onItemClick={(item) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(item.id)) n.delete(item.id); else n.add(item.id); return n; })}
            onItemLongPress={() => {}} onContextMenu={() => {}}
            onSelectAll={() => setSelectedIds(selectedIds.size === items.length ? new Set() : new Set(items.map(i => i.id)))}
            onSort={(key) => { if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortOrder('asc'); } }}
            sortKey={sortKey} sortOrder={sortOrder}
            onRename={() => {}} onMove={() => {}}
            onDelete={(item) => { setTargetItem(item); setActiveModal('delete-permanent'); }}
          />
        )}
      </div>

      {activeModal === 'clear' && (
        <DeleteModal 
          title="Empty Trash?" 
          count={items.length} 
          isPermanent={true}
          onClose={() => setActiveModal(null)} 
          onConfirm={handleConfirmClear} 
        />
      )}
      
      {activeModal === 'delete-permanent' && (
        <DeleteModal 
          title="Delete Permanently?" 
          count={selectedIds.size || (targetItem ? 1 : 0)} 
          isPermanent={true}
          onClose={() => setActiveModal(null)} 
          onConfirm={handleConfirmPermanentDelete} 
        />
      )}

      {selectedIds.size > 0 && (
        <SelectionBar 
          count={selectedIds.size} 
          onMove={() => {}} 
          onDelete={() => setActiveModal('delete-permanent')} 
          onClear={() => setSelectedIds(new Set())} 
        />
      )}
    </div>
  );
};
