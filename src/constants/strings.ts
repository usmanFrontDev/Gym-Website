/** Central place for user-facing text. */
export const strings = {
  appName: 'Iron Gym',
  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    search: 'Search',
    loading: 'Loading…',
    empty: 'Nothing to show yet.',
    error: 'Something went wrong. Please try again.',
    retry: 'Retry',
    previous: 'Previous',
    next: 'Next',
    actions: 'Actions',
    all: 'All',
    none: '---',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    view: 'View',
    back: 'Back',
  },
  auth: {
    title: 'Sign in',
    subtitle: 'Gym management system',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    logout: 'Sign out',
    forbiddenTitle: 'Access denied',
    forbiddenBody: 'You do not have permission to open this page.',
    notFoundTitle: 'Page not found',
    notFoundBody: 'The page you are looking for does not exist.',
    goHome: 'Go to my home page',
  },
  nav: {
    dashboard: 'Dashboard',
    members: 'Members',
    registerMember: 'Register member',
    managers: 'Managers',
    trainers: 'Trainers',
    expenses: 'Expenses',
    stats: 'My stats',
    myMembers: 'My members',
    performance: 'Performance',
    profile: 'Profile',
  },
  status: {
    ACTIVE: 'Active',
    EXPIRED: 'Expired',
    FROZEN: 'Frozen',
    BLOCKED: 'Blocked',
    UNKNOWN: 'Unknown',
    STAFF: 'Staff',
  },
  roles: {
    SUPER_ADMIN: 'Super admin',
    MANAGER: 'Manager',
    TRAINER: 'Trainer',
  },
  trainerTypes: {
    GYM: 'Gym trainer',
    MARTIAL_ARTS: 'Martial arts trainer',
  },
} as const

export const memberStrings = {
  columns: {
    name: 'Name', father: 'Father name', phone: 'Phone', emergency: 'Emergency contact', fingerprint: 'Fingerprint ID',
    status: 'Status', plan: 'Plan', registered: 'Registered', lastPayment: 'Last payment', nextDue: 'Next payment due',
    email: 'Email', trainer: 'Trainer', registeredBy: 'Registered by',
  },
  filters: {
    search: 'Search by name, phone or fingerprint ID',
    status: 'Status', allStatuses: 'All statuses', active: 'Active', inactive: 'Inactive / expired',
    plan: 'Plan', allPlans: 'All plans', from: 'Registered from', to: 'Registered to',
  },
  kpi: { total: 'Members', active: 'Active', expired: 'Expired', frozen: 'Frozen' },
  register: 'Register member',
} as const

export const expenseLabels = {
  RENT: 'Rent', ELECTRICITY: 'Electricity', SALARIES: 'Salaries', EQUIPMENT: 'Equipment', MAINTENANCE: 'Maintenance', OTHER: 'Other',
} as const
