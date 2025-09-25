export const VENDOR_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked'
} as const

export type VendorStatus = typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS]

export const getVendorStatusColor = (status: VendorStatus) => {
  switch (status) {
    case VENDOR_STATUS.ACTIVE:
      return {
        bg: 'bg-green-500',
        text: 'text-white'
      }
    case VENDOR_STATUS.PENDING:
      return {
        bg: 'bg-blue-500',
        text: 'text-white'
      }
    case VENDOR_STATUS.SUSPENDED:
      return {
        bg: 'bg-orange-500',
        text: 'text-white'
      }
    case VENDOR_STATUS.BLOCKED:
      return {
        bg: 'bg-red-500',
        text: 'text-white'
      }
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600'
      }
  }
}

export const getVendorStatusLabel = (status: VendorStatus): string => {
  switch (status) {
    case VENDOR_STATUS.ACTIVE:
      return 'Actif'
    case VENDOR_STATUS.PENDING:
      return 'En attente'
    case VENDOR_STATUS.SUSPENDED:
      return 'Suspendu'
    case VENDOR_STATUS.BLOCKED:
      return 'Bloqué'
    default:
      return status
  }
}
