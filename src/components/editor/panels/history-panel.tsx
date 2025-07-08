import React from 'react';
import { HistoryTab } from './tabs/history';

export const HistoryPanel: React.FC = () => (
  <div className="h-full overflow-y-auto">
    <HistoryTab />
  </div>
); 