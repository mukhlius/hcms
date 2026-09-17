'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Building2, 
  Layers, 
  FolderTree, 
  Briefcase, 
  Plus, 
  ArrowRightLeft,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { OrganizationUnitNode, OrgUnitType } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface OrganizationTreeProps {
  nodes: OrganizationUnitNode[];
  selectedUnit: OrganizationUnitNode | null;
  onSelectUnit: (unit: OrganizationUnitNode) => void;
  onAddChild?: (parentUnit: OrganizationUnitNode) => void;
  onMoveUnit?: (unit: OrganizationUnitNode) => void;
}

const typeColorMap: Record<OrgUnitType, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  BUSINESS_UNIT: 'secondary',
  DIVISION: 'primary',
  DEPARTMENT: 'success',
  SECTION: 'warning',
  SUB_SECTION: 'primary',
  OTHER: 'secondary',
};

const typeLabelMap: Record<OrgUnitType, string> = {
  BUSINESS_UNIT: 'Business Unit',
  DIVISION: 'Divisi',
  DEPARTMENT: 'Departemen',
  SECTION: 'Seksi',
  SUB_SECTION: 'Sub Seksi',
  OTHER: 'Unit Lain',
};

interface TreeNodeProps {
  node: OrganizationUnitNode;
  level: number;
  selectedUnit: OrganizationUnitNode | null;
  onSelectUnit: (unit: OrganizationUnitNode) => void;
  onAddChild?: (parentUnit: OrganizationUnitNode) => void;
  onMoveUnit?: (unit: OrganizationUnitNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  selectedUnit,
  onSelectUnit,
  onAddChild,
  onMoveUnit,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const isSelected = selectedUnit?.id === node.id;
  const hasChildren = Boolean(node.children && node.children.length > 0);

  return (
    <div className="select-none text-sm">
      <div
        className={cn(
          'group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all duration-150 cursor-pointer border mb-1',
          isSelected
            ? 'bg-blue-50/90 border-blue-200 text-blue-900 shadow-xs'
            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
        )}
        style={{ marginLeft: `${level * 16}px` }}
        onClick={() => onSelectUnit(node)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Chevron expand/collapse */}
          <button
            type="button"
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors',
              !hasChildren && 'invisible'
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isExpanded ? 'rotate-90 text-blue-600' : ''
              )}
            />
          </button>

          {/* Type Icon */}
          <div className="shrink-0 text-slate-500">
            {node.type === 'BUSINESS_UNIT' && <Building2 className="h-4 w-4 text-purple-600" />}
            {node.type === 'DIVISION' && <Layers className="h-4 w-4 text-blue-600" />}
            {node.type === 'DEPARTMENT' && <FolderTree className="h-4 w-4 text-emerald-600" />}
            {node.type === 'SECTION' && <Briefcase className="h-4 w-4 text-amber-600" />}
            {node.type === 'SUB_SECTION' && <Briefcase className="h-4 w-4 text-cyan-600" />}
            {node.type === 'OTHER' && <FolderTree className="h-4 w-4 text-slate-500" />}
          </div>

          {/* Unit Name & Code */}
          <div className="min-w-0 flex-1 truncate">
            <span className="font-semibold tracking-tight mr-2">{node.name}</span>
            <span className="text-xs font-mono text-slate-400">[{node.code}]</span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <Badge variant={typeColorMap[node.type] || 'secondary'} className="text-[10px] px-1.5 py-0.5">
              {typeLabelMap[node.type] || node.type}
            </Badge>

            {node.positions_count !== undefined && node.positions_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                <Users className="h-3 w-3" />
                {node.positions_count}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
          {onAddChild && (
            <button
              type="button"
              title="Tambah Sub-unit"
              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveUnit && (
            <button
              type="button"
              title="Pindahkan Posisi Hierarki"
              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUnit(node);
              }}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Children rendering */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {node.children!.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedUnit={selectedUnit}
                onSelectUnit={onSelectUnit}
                onAddChild={onAddChild}
                onMoveUnit={onMoveUnit}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const OrganizationTree: React.FC<OrganizationTreeProps> = ({
  nodes,
  selectedUnit,
  onSelectUnit,
  onAddChild,
  onMoveUnit,
}) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <FolderTree className="h-10 w-10 text-slate-300 mb-2" />
        <p className="text-sm font-medium">Belum ada struktur organisasi terkonfigurasi.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          selectedUnit={selectedUnit}
          onSelectUnit={onSelectUnit}
          onAddChild={onAddChild}
          onMoveUnit={onMoveUnit}
        />
      ))}
    </div>
  );
};
