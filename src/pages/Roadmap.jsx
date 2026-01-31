import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon, 
  PlayCircleIcon, 
  ClockIcon, 
  SparklesIcon, 
  MapIcon,
  TrophyIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const Roadmap = () => {
  const [selectedPath, setSelectedPath] = useState('computer-science')
  const [expandedNodes, setExpandedNodes] = useState(new Set([1, 2]))
  const [completedNodes, setCompletedNodes] = useState(new Set(['http', 'domain', 'hosting', 'dns', 'browsers']))

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const toggleCompleted = (nodeId) => {
    const newCompleted = new Set(completedNodes)
    if (newCompleted.has(nodeId)) {
      newCompleted.delete(nodeId)
    } else {
      newCompleted.add(nodeId)
    }
    setCompletedNodes(newCompleted)
  }

  const roadmapData = {
    'computer-science': {
      title: 'Backend Development',
      description: 'Complete roadmap to become a Backend Developer',
      gradient: 'from-blue-500 to-cyan-500',
      nodes: [
        {
          id: 1,
          title: 'Internet Fundamentals',
          status: 'completed',
          description: 'How the internet works',
          children: [
            { id: 'http', title: 'HTTP Protocol', status: 'completed' },
            { id: 'domain', title: 'Domain Names', status: 'completed' },
            { id: 'hosting', title: 'Hosting', status: 'completed' },
            { id: 'dns', title: 'DNS', status: 'completed' },
            { id: 'browsers', title: 'Browsers', status: 'completed' }
          ]
        },
        {
          id: 2,
          title: 'Programming Language',
          status: 'current',
          description: 'Choose your backend language',
          children: [
            { id: 'js', title: 'JavaScript/Node.js', status: 'current' },
            { id: 'python', title: 'Python', status: 'pending' },
            { id: 'java', title: 'Java', status: 'pending' },
            { id: 'csharp', title: 'C#', status: 'pending' },
            { id: 'php', title: 'PHP', status: 'pending' },
            { id: 'rust', title: 'Rust', status: 'pending' }
          ]
        },
        {
          id: 3,
          title: 'Algorithms & Data Structures',
          status: 'pending',
          description: 'Sorting, searching, dynamic programming',
          children: [
            { id: 'alg1', title: 'Basic Algorithms', status: 'pending' },
            { id: 'alg2', title: 'Data Structures', status: 'pending' },
            { id: 'alg3', title: 'Complexity Analysis', status: 'pending' }
          ]
        },
        {
          id: 4,
          title: 'Database Systems',
          status: 'pending',
          description: 'SQL, NoSQL, database design',
          children: [
            { id: 'db1', title: 'Relational Databases', status: 'pending' },
            { id: 'db2', title: 'NoSQL Databases', status: 'pending' },
            { id: 'db3', title: 'Database Design', status: 'pending' },
            { id: 'db4', title: 'ORM Technologies', status: 'pending' }
          ]
        },
        {
          id: 5,
          title: 'Operating Systems',
          status: 'pending',
          description: 'Processes, memory, file systems',
          children: [
            { id: 'os1', title: 'OS Concepts', status: 'pending' },
            { id: 'os2', title: 'Memory Management', status: 'pending' },
            { id: 'os3', title: 'Process Management', status: 'pending' },
            { id: 'os4', title: 'File Systems', status: 'pending' }
          ]
        },
        {
          id: 6,
          title: 'Advanced Topics',
          status: 'pending',
          description: 'Distributed systems, security, AI',
          children: [
            { id: 'adv1', title: 'Distributed Systems', status: 'pending' },
            { id: 'adv2', title: 'Security Practices', status: 'pending' },
            { id: 'adv3', title: 'DevOps & CI/CD', status: 'pending' },
            { id: 'adv4', title: 'Cloud Technologies', status: 'pending' }
          ]
        },
      ]
    },
    'mathematics': {
      title: 'Mathematics for CS',
      description: 'Essential mathematics for computer science',
      gradient: 'from-purple-500 to-pink-500',
      nodes: [
        { id: 1, title: 'Linear Algebra', status: 'completed', description: 'Vectors, matrices, eigenvalues' },
        { id: 2, title: 'Calculus', status: 'current', description: 'Derivatives, integrals, optimization' },
        { id: 3, title: 'Statistics', status: 'pending', description: 'Probability, distributions, inference' },
        { id: 4, title: 'Discrete Math', status: 'pending', description: 'Logic, sets, graph theory' }
      ]
    },
    'web-development': {
      title: 'Web Development',
      description: 'Full-stack web development journey',
      gradient: 'from-green-500 to-emerald-500',
      nodes: [
        { id: 1, title: 'HTML & CSS', status: 'completed', description: 'Markup and styling fundamentals' },
        { id: 2, title: 'JavaScript', status: 'completed', description: 'Programming language of the web' },
        { id: 3, title: 'React.js', status: 'current', description: 'Modern frontend framework' },
        { id: 4, title: 'Node.js', status: 'pending', description: 'Backend JavaScript runtime' },
        { id: 5, title: 'Databases', status: 'pending', description: 'Data storage and management' }
      ]
    },
  }

  const currentRoadmap = roadmapData[selectedPath]

  const getStatusIcon = (status, nodeId) => {
    const isCompleted = completedNodes.has(nodeId)
    
    if (isCompleted) {
      return <CheckCircleIcon className="w-5 h-5 text-green-400" />
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'current':
        return <PlayCircleIcon className="w-5 h-5 text-blue-400 animate-pulse" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const TreeNode = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isCompleted = completedNodes.has(node.id)
    
    return (
      <div className="relative">
        {/* Vertical line */}
        {level > 0 && (
          <div 
            className="absolute top-5 bottom-0 left-4 w-px bg-gradient-to-b from-blue-400/30 to-purple-400/30"
            style={{ left: `${level * 24}px` }}
          />
        )}
        
        <div className="flex items-start mb-4">
          {/* Horizontal line */}
          {level > 0 && (
            <div 
              className="w-4 h-px mt-3 bg-gradient-to-r from-blue-400/30 to-purple-400/30"
              style={{ marginLeft: `${level * 24}px` }}
            />
          )}
          
          {/* Expand/collapse button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 mr-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
          
          {/* Node content */}
          <div className={`
            flex-1 p-4 rounded-xl border-2 backdrop-blur-md
            transition-all duration-300 shadow-lg hover:shadow-xl
            ${isCompleted 
              ? 'bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-400/50 text-emerald-100' 
              : node.status === 'current'
              ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-400/50 text-blue-100'
              : 'bg-gray-800/50 border-gray-600/50 text-gray-300 hover:border-gray-500'
            }
          `}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="font-bold text-lg mr-3">{node.title}</h3>
                  {/* Checkbox for marking completion */}
                  <button
                    onClick={() => toggleCompleted(node.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
                  </button>
                </div>
                <p className="text-sm opacity-80 mb-2">{node.description}</p>
                
                {/* Progress indicator for current */}
                {node.status === 'current' && !isCompleted && (
                  <div className="w-full h-1 bg-gray-700/50 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
              
              <div className="ml-4">
                {getStatusIcon(node.status, node.id)}
              </div>
            </div>
          </div>
        </div>

        {/* Child nodes */}
        {hasChildren && isExpanded && (
          <div className="ml-10 pl-4 border-l-2 border-gray-700/30">
            {node.children.map(child => (
              <TreeNode 
                key={child.id} 
                node={child} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const pathOptions = [
    { key: 'computer-science', label: 'Computer Science', icon: '💻' },
    { key: 'mathematics', label: 'Mathematics', icon: '📐' },
    { key: 'web-development', label: 'Web Development', icon: '🌐' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-zinc-900 overflow-hidden">
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Circuit board pattern */}
        <svg className="absolute w-full h-full opacity-5">
          <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill="rgba(59,130,246,0.5)" />
            <circle cx="90" cy="10" r="2" fill="rgba(59,130,246,0.5)" />
            <circle cx="90" cy="90" r="2" fill="rgba(59,130,246,0.5)" />
            <circle cx="10" cy="90" r="2" fill="rgba(59,130,246,0.5)" />
            <path d="M 10 10 L 90 10 M 90 10 L 90 90 M 90 90 L 10 90 M 10 90 L 10 10" 
                  stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" fill="none"/>
            <path d="M 10 50 L 90 50 M 50 10 L 50 90" 
                  stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" fill="none"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl"></div>
            <MapIcon className="w-10 h-10 text-blue-400 mr-3 relative z-10" />
            <h1 className="text-5xl md:text-6xl font-extrabold relative z-10">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Developer
              </span>
              <span className="text-white ml-3">Roadmap</span>
            </h1>
            <SparklesIcon className="w-10 h-10 text-purple-400 ml-3 relative z-10 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Navigate your learning journey with structured paths and real-time progress tracking
          </p>
        </motion.div>

        {/* Path Selector Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {pathOptions.map((option, index) => (
              <motion.button
                key={option.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPath(option.key)}
                className={`relative px-8 py-5 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-3 overflow-hidden group ${
                  selectedPath === option.key
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/30 border-2 border-blue-400/50'
                    : 'bg-gray-800/50 backdrop-blur-sm text-gray-300 border border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {selectedPath === option.key && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
                )}
                <span className="text-2xl relative z-10">{option.icon}</span>
                <span className="relative z-10 text-base">{option.label}</span>
                {selectedPath === option.key && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Main Roadmap Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-8 shadow-2xl overflow-hidden"
        >
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          
          {/* Title Section */}
          <div className="text-center mb-10 relative z-10">
            <h2 className={`text-4xl font-bold bg-gradient-to-r ${currentRoadmap.gradient} bg-clip-text text-transparent mb-3`}>
              {currentRoadmap.title}
            </h2>
            <p className="text-gray-400 text-lg">{currentRoadmap.description}</p>
            <div className="mt-4 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
          </div>
          
          {/* Tree Visualization Area */}
          <div className="relative mb-10 bg-gray-800/20 rounded-2xl p-6 border border-gray-700/30">
            {currentRoadmap.nodes.map(node => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>

          {/* Progress Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden text-center p-6 bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/30 rounded-2xl backdrop-blur-md group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <TrophyIcon className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {completedNodes.size}
              </div>
              <div className="text-emerald-300 font-medium">Completed</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden text-center p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl backdrop-blur-md group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlayCircleIcon className="w-10 h-10 text-blue-400 mx-auto mb-3 animate-pulse" />
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {countStatus(currentRoadmap.nodes, 'current')}
              </div>
              <div className="text-blue-300 font-medium">In Progress</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden text-center p-6 bg-gradient-to-br from-gray-600/20 to-slate-600/20 border border-gray-500/30 rounded-2xl backdrop-blur-md group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <ClockIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <div className="text-4xl font-bold text-gray-400 mb-2">
                {countStatus(currentRoadmap.nodes, 'pending')}
              </div>
              <div className="text-gray-300 font-medium">Upcoming</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Helper function to count nodes by status (including children)
function countStatus(nodes, status) {
  let count = 0
  
  function checkNode(node) {
    if (node.status === status) count++
    if (node.children) {
      node.children.forEach(child => checkNode(child))
    }
  }
  
  nodes.forEach(node => checkNode(node))
  return count
}

export default Roadmap