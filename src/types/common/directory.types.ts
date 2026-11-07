/** The only member details a manager sees for members they did not register. */
export interface DirectoryRow {
  id: string
  full_name: string
  father_name: string | null
  registration_date: string
  last_payment_date: string | null
}

export interface DirectoryPage {
  rows: DirectoryRow[]
  total: number
}
