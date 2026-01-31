import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Roadmap = () => {
  const [selectedPath, setSelectedPath] = useState('backend');

  const roadmapData = {
    'backend': {
      title: 'Backend Development',
      description: 'Complete roadmap to become a Backend Developer',
      gradient: 'from-blue-500 to-cyan-500',
      nodes: [
        {
          id: 'internet',
          title: 'Internet',
          type: 'main',
          x: 20,
          y: 30,
          description: 'Fundamentals of how internet works',
          childNodes: [
            { id: 'http', title: 'What is HTTP?', x: 35, y: 15, type: 'topic' },
            { id: 'domain', title: 'What is Domain Name?', x: 35, y: 25, type: 'topic' },
            { id: 'hosting', title: 'What is hosting?', x: 35, y: 35, type: 'topic' },
            { id: 'dns', title: 'DNS and how it works?', x: 35, y: 45, type: 'topic' },
            { id: 'browsers', title: 'Browsers and how they work?', x: 35, y: 55, type: 'topic' }
          ]
        },
        {
          id: 'languages',
          title: 'Pick a Language',
          type: 'main',
          x: 50,
          y: 30,
          description: 'Choose your backend programming language',
          childNodes: [
            { id: 'js', title: 'JavaScript', x: 65, y: 15, type: 'language' },
            { id: 'python', title: 'Python', x: 65, y: 25, type: 'language' },
            { id: 'java', title: 'Java', x: 65, y: 35, type: 'language' },
            { id: 'csharp', title: 'C#', x: 65, y: 45, type: 'language' },
            { id: 'php', title: 'PHP', x: 65, y: 55, type: 'language' },
            { id: 'rust', title: 'Rust', x: 65, y: 65, type: 'language' }
          ]
        },
        {
          id: 'version-control',
          title: 'Version Control',
          type: 'main',
          x: 20,
          y: 70,
          childNodes: [
            { id: 'git', title: 'Git', x: 35, y: 65, type: 'topic', status: 'required' },
            { id: 'github', title: 'GitHub', x: 35, y: 75, type: 'topic' },
            { id: 'gitlab', title: 'GitLab', x: 35, y: 85, type: 'topic' }
          ]
        },
        {
          id: 'database',
          title: 'Databases',
          type: 'main',
          x: 50,
          y: 70,
          childNodes: [
            { id: 'mysql', title: 'MySQL', x: 65, y: 65, type: 'topic' },
            { id: 'postgresql', title: 'PostgreSQL', x: 65, y: 75, type: 'topic', status: 'recommended' },
            { id: 'mongodb', title: 'MongoDB', x: 65, y: 85, type: 'topic' }
          ]
        }
      ]
    }
  };

  const getNodeStyles = (node) => {
    const type = node.type || 'default';
    const status = node.status || 'default';

    switch (type) {
      case 'main':
        return 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-300';
      case 'language':
        return 'bg-blue-500/20 border-blue-400/50 hover:bg-blue-500/30';
      case 'topic':
        if (status === 'required') {
          return 'bg-pink-500/20 border-pink-400/50 hover:bg-pink-500/30';
        }
        if (status === 'recommended') {
          return 'bg-purple-500/20 border-purple-400/50 hover:bg-purple-500/30';
        }
        return 'bg-white/10 border-white/20 hover:bg-white/20';
      default:
        return 'bg-white/10 border-white/20 hover:bg-white/20';
    }
  };

  const currentRoadmap = roadmapData[selectedPath];

  const ConnectionLines = ({ nodes }) => {
    return (
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {nodes.map(mainNode => 
          mainNode.childNodes?.map(childNode => (
            <g key={`connection-${mainNode.id}-${childNode.id}`}>
              {/* Dotted connection line */}
              <motion.path
                d={`M ${mainNode.x},${mainNode.y} Q ${(mainNode.x + childNode.x) / 2},${childNode.y} ${childNode.x},${childNode.y}`}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
                fill="none"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </g>
          ))
        )}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <MapIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">
              Learning <span className="text-yellow-400">Roadmap</span>
            </h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300">
            Your path to becoming a Backend Developer
          </p>
        </motion.div>

        {/* Roadmap Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl min-h-[800px] overflow-hidden"
        >
          {/* Background pattern */}
          <div className="absolute inset-0" style={{ zIndex: 0 }}>
            <svg className="w-full h-full opacity-5">
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="currentColor" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
          </div>

          {/* Connection lines */}
          <ConnectionLines nodes={currentRoadmap.nodes} />

          {/* Main nodes and their children */}
          {currentRoadmap.nodes.map((node) => (
            <div key={`node-group-${node.id}`}>
              {/* Main topic node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`
                    px-4 py-3 rounded-xl border backdrop-blur-lg
                    transition-all duration-300 shadow-xl
                    ${getNodeStyles(node)}
                  `}
                >
                  <h3 className="font-bold text-lg whitespace-nowrap">{node.title}</h3>
                </motion.div>
              </motion.div>

              {/* Child nodes */}
              {node.childNodes?.map((child, index) => (
                <motion.div
                  key={`child-${child.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${child.x}%`, top: `${child.y}%` }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`
                      px-3 py-2 rounded-lg border backdrop-blur-lg
                      transition-all duration-300 shadow-lg
                      ${getNodeStyles(child)}
                    `}
                  >
                    <span className="text-sm whitespace-nowrap">{child.title}</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-lg rounded-lg p-4 z-30">
            <h4 className="text-white text-sm font-semibold mb-2">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
                <span className="text-white/80 text-sm">Main Topics</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-pink-500/50 mr-2"></span>
                <span className="text-white/80 text-sm">Required</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-purple-500/50 mr-2"></span>
                <span className="text-white/80 text-sm">Recommended</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Roadmap;
