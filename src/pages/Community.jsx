import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const Community = () => {
  // Mock chat data to create the dimmed background effect
  const mockChats = [
    {
      id: 1,
      user: 'Alice Chen',
      message: 'Has anyone studied quantum computing? Looking for study partners!',
      time: '2:30 PM'
    },
    {
      id: 2,
      user: 'Bob Smith',
      message: 'I found this great resource on machine learning, happy to share!',
      time: '2:32 PM'
    },
    {
      id: 3,
      user: 'Carol Davis',
      message: 'Working on a project about renewable energy. Anyone interested?',
      time: '2:35 PM'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="container mx-auto max-w-6xl relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white flex items-center justify-center gap-4">
            <UsersIcon className="w-12 h-12 text-blue-400" />
            Community Hub
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-yellow-400" />
          </h1>
          <p className="text-xl text-gray-300 mt-4">
            Connect, share, and learn together
          </p>
        </motion.div>

        {/* Chat Interface (Dimmed) */}
        <div className="relative">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden filter blur-[2px]">
            {/* Chat Messages Area */}
            <div className="h-[600px] p-6 space-y-6">
              {mockChats.map((chat) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 0.7, x: 0 }}
                  className="flex items-start gap-4"
                >
                  <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{chat.user}</span>
                      <span className="text-sm text-gray-400">{chat.time}</span>
                    </div>
                    <p className="text-gray-300 mt-1">{chat.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chat Input Area */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Type your message..."
                  disabled
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  disabled
                  className="p-3 rounded-xl bg-blue-500/50 text-white/50 cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 rounded-2xl"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <h2 className="text-6xl font-bold text-white mb-4 tracking-wider">
                  COMING SOON
                </h2>
              </motion.div>
              <p className="text-xl text-gray-300 max-w-lg mx-auto">
                We're building an amazing community space for learners to connect, 
                collaborate, and grow together. Stay tuned!
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 0.5
                  }}
                  className="w-3 h-3 bg-blue-400 rounded-full"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 1
                  }}
                  className="w-3 h-3 bg-purple-400 rounded-full"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: 1.5
                  }}
                  className="w-3 h-3 bg-pink-400 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
