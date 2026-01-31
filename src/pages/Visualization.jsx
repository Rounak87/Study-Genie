import { useState } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon, BeakerIcon, XMarkIcon } from '@heroicons/react/24/outline';

const simulationData = [
  {
    id: 1,
    title: 'Wave Interference',
    description: 'Explore wave interference patterns and phenomena',
    category: 'Physics',
    color: 'from-blue-500 to-cyan-500',
    simUrl: 'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_en.html'
  },
  {
    id: 2,
    title: 'Electric Field Lines',
    description: 'Visualize electric fields and charges',
    category: 'Physics',
    color: 'from-purple-500 to-pink-500',
    simUrl: 'https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_en.html'
  },
  {
    id: 3,
    title: 'Circuit Construction',
    description: 'Build and test electronic circuits',
    category: 'Electronics',
    color: 'from-yellow-500 to-orange-500',
    simUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html'
  },
  {
    id: 4,
    title: 'Molecule Shapes',
    description: 'Explore molecular geometry and bonding',
    category: 'Chemistry',
    color: 'from-green-500 to-emerald-500',
    simUrl: 'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html'
  },
  {
    id: 5,
    title: 'Energy Forms',
    description: 'Understand different forms of energy',
    category: 'Physics',
    color: 'from-red-500 to-orange-500',
    simUrl: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_en.html'
  },
  {
    id: 6,
    title: 'Projectile Motion',
    description: 'Study the physics of projectile motion',
    category: 'Physics',
    color: 'from-indigo-500 to-purple-500',
    simUrl: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html'
  },
  {
    id: 7,
    title: 'Gas Properties',
    description: 'Explore gas laws and molecular behavior',
    category: 'Chemistry',
    color: 'from-blue-500 to-indigo-500',
    simUrl: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_en.html'
  },
  {
    id: 8,
    title: 'Balancing Chemical Equations',
    description: 'Practice balancing chemical equations',
    category: 'Chemistry',
    color: 'from-teal-500 to-cyan-500',
    simUrl: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html'
  },
  {
    id: 9,
    title: 'Gravity Force Lab',
    description: 'Investigate gravitational forces',
    category: 'Physics',
    color: 'from-violet-500 to-purple-500',
    simUrl: 'https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_en.html'
  },
  {
    id: 10,
    title: 'Vector Addition',
    description: 'Learn about vector operations visually',
    category: 'Mathematics',
    color: 'from-rose-500 to-pink-500',
    simUrl: 'https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition_en.html'
  }
];

const Visualization = () => {
  const [selectedSim, setSelectedSim] = useState(null);
  const [filter, setFilter] = useState('all');

  const categories = ['all', ...new Set(simulationData.map(sim => sim.category))];
  
  const filteredSims = filter === 'all' 
    ? simulationData 
    : simulationData.filter(sim => sim.category === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      {/* Header */}
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white flex items-center justify-center gap-4">
            <BeakerIcon className="w-12 h-12 text-blue-400" />
            Interactive Visualizations
            <SparklesIcon className="w-12 h-12 text-yellow-400" />
          </h1>
          <p className="text-xl text-gray-300 mt-4">
            Explore concepts through interactive simulations
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(category)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300
                ${filter === category
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white/10 text-white hover:bg-white/20'
                }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Simulation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSims.map((sim) => (
            <motion.div
              key={sim.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <button
                onClick={() => setSelectedSim(sim)}
                className={`w-full h-full p-6 rounded-2xl border border-white/20 backdrop-blur-lg
                  bg-gradient-to-br ${sim.color}/20 hover:${sim.color}/30
                  transition-all duration-300 text-left`}
              >
                <h3 className="text-2xl font-bold text-white mb-2">{sim.title}</h3>
                <p className="text-gray-300 mb-4">{sim.description}</p>
                <span className="inline-block px-3 py-1 rounded-full text-sm bg-white/10">
                  {sim.category}
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Simulation Modal */}
      {selectedSim && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 rounded-2xl w-full max-w-6xl overflow-hidden relative"
          >
            <div className="p-4 bg-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{selectedSim.title}</h3>
              <button
                onClick={() => setSelectedSim(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={selectedSim.simUrl}
                title={selectedSim.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Visualization;
