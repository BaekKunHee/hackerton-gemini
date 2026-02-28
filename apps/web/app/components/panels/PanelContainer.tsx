'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SourcePanelData, PerspectivePanelData, BiasPanelData } from '@/lib/types';
import SourcePanel from './SourcePanel';
import PerspectivePanel from './PerspectivePanel';
import BiasPanel from './BiasPanel';
import TabNav from '@/app/components/shared/TabNav';

interface PanelContainerProps {
  source: SourcePanelData | null;
  perspective: PerspectivePanelData | null;
  bias: BiasPanelData | null;
  sourceLoading?: boolean;
  perspectiveLoading?: boolean;
  biasLoading?: boolean;
}

const panelTabs = ['소스 검증', '다른 관점', '편향 분석'];

export default function PanelContainer({
  source,
  perspective,
  bias,
  sourceLoading,
  perspectiveLoading,
  biasLoading,
}: PanelContainerProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <>
      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
        >
          <SourcePanel data={source} isLoading={sourceLoading} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PerspectivePanel data={perspective} isLoading={perspectiveLoading} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <BiasPanel data={bias} isLoading={biasLoading} />
        </motion.div>
      </div>

      {/* Mobile: Tabbed view */}
      <div className="lg:hidden">
        <div className="mb-4">
          <TabNav
            tabs={panelTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 0 && (
              <SourcePanel data={source} isLoading={sourceLoading} />
            )}
            {activeTab === 1 && (
              <PerspectivePanel
                data={perspective}
                isLoading={perspectiveLoading}
              />
            )}
            {activeTab === 2 && (
              <BiasPanel data={bias} isLoading={biasLoading} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
