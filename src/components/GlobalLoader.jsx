import { motion } from "framer-motion";

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
      <motion.div
        className="w-16 h-16 border-4 border-t-green-500 border-gray-700 rounded-full animate-spin mb-6"
        transition={{ repeat: Infinity, duration: 1 }}
      />
      <p className="text-gray-300 text-lg font-semibold tracking-wide">
        Завантаження...
      </p>
    </div>
  );
}
