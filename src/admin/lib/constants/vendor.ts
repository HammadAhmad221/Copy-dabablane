export const VENDOR_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inActive',
  SUSPENDED: 'suspended',
  WAITING: 'waiting'
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
    case VENDOR_STATUS.INACTIVE:
      return {
        bg: 'bg-gray-500',
        text: 'text-white'
      }
    case VENDOR_STATUS.SUSPENDED:
      return {
        bg: 'bg-orange-500',
        text: 'text-white'
      }
    case VENDOR_STATUS.WAITING:
      return {
        bg: 'bg-yellow-500',
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
      return 'Active'
    case VENDOR_STATUS.PENDING:
      return 'Pending'
    case VENDOR_STATUS.INACTIVE:
      return 'inActive'
    case VENDOR_STATUS.SUSPENDED:
      return 'Suspended'
    case VENDOR_STATUS.WAITING:
      return 'Waiting'
    default:
      return status
  }
}
