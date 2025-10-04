import React, { createContext, useContext, useState, useEffect } from 'react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
}

interface ProgressContextType {
  level: number
  xp: number
  totalXP: number
  xpToNextLevel: number
  achievements: Achievement[]
  addXP: (amount: number) => void
  unlockAchievement: (achievementId: string) => void
  getProgressPercentage: () => number
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export const useProgress = () => {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return context
}

interface ProgressProviderProps {
  children: React.ReactNode
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [level, setLevel] = useState(1)
  const [xp, setXP] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-idea',
      title: 'First Idea',
      description: 'Generated your first creative idea',
      icon: '🌱',
      unlocked: false
    },
    {
      id: 'idea-machine',
      title: 'Idea Machine',
      description: 'Generated 10 creative ideas',
      icon: '💡',
      unlocked: false
    },
    {
      id: 'completionist',
      title: 'Completionist',
      description: 'Completed 5 ideas',
      icon: '🏆',
      unlocked: false
    },
    {
      id: 'level-up',
      title: 'Level Up',
      description: 'Reached level 5',
      icon: '⚡',
      unlocked: false
    },
    {
      id: 'code-forge-master',
      title: 'Code Forge Master',
      description: 'Generated 25 code components',
      icon: '🔥',
      unlocked: false
    },
    {
      id: 'theme-explorer',
      title: 'Theme Explorer',
      description: 'Used all 6 aesthetic themes',
      icon: '🎨',
      unlocked: false
    }
  ])

  // Calculate XP needed for next level (exponential growth)
  const getXPForLevel = (targetLevel: number): number => {
    return Math.floor(100 * Math.pow(1.5, targetLevel - 1))
  }

  // Calculate XP needed to reach next level
  const xpToNextLevel = getXPForLevel(level + 1) - totalXP

  useEffect(() => {
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('supervisor-progress')
    if (savedProgress) {
      const { level: savedLevel, totalXP: savedTotalXP, achievements: savedAchievements } = JSON.parse(savedProgress)
      setLevel(savedLevel || 1)
      setTotalXP(savedTotalXP || 0)
      setXP(savedTotalXP || 0)
      if (savedAchievements) {
        setAchievements(prev => prev.map(achievement => {
          const saved = savedAchievements.find((a: Achievement) => a.id === achievement.id)
          return saved ? { ...achievement, ...saved } : achievement
        }))
      }
    }
  }, [])

  useEffect(() => {
    // Save progress to localStorage
    localStorage.setItem('supervisor-progress', JSON.stringify({
      level,
      totalXP,
      achievements
    }))
  }, [level, totalXP, achievements])

  useEffect(() => {
    // Check for level ups
    let newLevel = 1
    let requiredXP = 0
    
    while (requiredXP <= totalXP) {
      newLevel++
      requiredXP += getXPForLevel(newLevel)
    }
    
    newLevel-- // Step back to the achieved level
    
    if (newLevel > level) {
      setLevel(newLevel)
      // Could trigger level up notification here
    }
    
    // Calculate current level XP (XP within the current level)
    const currentLevelBaseXP = totalXP - getXPForLevel(newLevel)
    setXP(Math.max(0, currentLevelBaseXP))
  }, [totalXP, level])

  const addXP = (amount: number) => {
    setTotalXP(prev => prev + amount)
  }

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => prev.map(achievement => 
      achievement.id === achievementId && !achievement.unlocked
        ? { ...achievement, unlocked: true, unlockedAt: new Date() }
        : achievement
    ))
  }

  const getProgressPercentage = (): number => {
    const currentLevelXP = getXPForLevel(level + 1) - getXPForLevel(level)
    return Math.min(100, (xp / currentLevelXP) * 100)
  }

  return (
    <ProgressContext.Provider value={{
      level,
      xp,
      totalXP,
      xpToNextLevel,
      achievements,
      addXP,
      unlockAchievement,
      getProgressPercentage
    }}>
      {children}
    </ProgressContext.Provider>
  )
}