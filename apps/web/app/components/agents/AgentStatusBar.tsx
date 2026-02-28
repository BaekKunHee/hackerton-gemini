'use client';

import { motion } from 'framer-motion';
import { useAgentStore } from '@/lib/store/useAgentStore';
import AgentCard from './AgentCard';
import type { AgentId } from '@/lib/types';

const agentOrder: AgentId[] = ['analyzer', 'source', 'perspective', 'socrates'];

export default function AgentStatusBar() {
  const agents = useAgentStore((s) => s.agents);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {agentOrder.map((id, index) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
          >
            <AgentCard agent={agents[id]} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
