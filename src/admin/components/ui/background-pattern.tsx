

import { motion } from "framer-motion"

export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-10 opacity-50">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <motion.div 
        className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-coral opacity-20 blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />
      <motion.div 
        className="absolute left-60 right-0 top-40 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-teal opacity-20 blur-[100px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
      />
    </div>
  )
}
