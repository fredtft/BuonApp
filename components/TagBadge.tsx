import React from 'react';
import { DietTag } from '../types';
import { TAG_LABELS } from '../constants';

const TagBadge: React.FC<{ tag: DietTag }> = ({ tag }) => {
  const config = TAG_LABELS[tag];
  if (!config) return null;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${config.color} whitespace-nowrap`}>
      {config.label}
    </span>
  );
};

export default TagBadge;