export const BLANE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  WAITING: 'waiting'
} as const

export type BlaneStatus = typeof BLANE_STATUS[keyof typeof BLANE_STATUS]

export const getStatusColor = (status: BlaneStatus) => {
  switch (status) {
    case BLANE_STATUS.ACTIVE:
      return {
        bg: 'bg-teal-500',
        text: 'text-white'
      }
    case BLANE_STATUS.INACTIVE:
      return {
        bg: 'bg-orange-500',
        text: 'text-white'
      }
    case BLANE_STATUS.EXPIRED:
      return {
        bg: 'bg-red-500',
        text: 'text-white'
      }
    case BLANE_STATUS.WAITING:
      return {
        bg: 'bg-blue-500',
        text: 'text-white'
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600'
      }
  }
}

export const getStatusLabel = (status: BlaneStatus): string => {
  switch (status) {
    case BLANE_STATUS.ACTIVE:
      return 'Actif'
    case BLANE_STATUS.INACTIVE:
      return 'Inactif'
    case BLANE_STATUS.EXPIRED:
      return 'Expiré'
    case BLANE_STATUS.WAITING:
      return 'En attente'
    default:
      return status
  }
} 