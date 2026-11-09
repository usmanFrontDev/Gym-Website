import { PAGE_SIZE } from '@/components/common/Pagination'
import { Rpc } from '@/constants/tables'
import type { DirectoryPage } from '@/types/common/directory.types'
import type { PaymentMethod } from '@/types/common/member.types'
import { supabase, unwrap } from '../supabase-client'

export const directoryService = {
  /** Every gym member, limited columns only (the RPC enforces which roles may call it). */
  async search(search: string, page: number): Promise<DirectoryPage> {
    return unwrap(
      await supabase.rpc(Rpc.GymDirectory, { p_search: search || null, p_page: page, p_page_size: PAGE_SIZE }),
    ) as DirectoryPage
  },

  /** Records a fee on the member's current plan; the billing RPC moves the last payment date. */
  async collectFee(memberId: string, amount: number, method: PaymentMethod): Promise<string> {
    return unwrap(await supabase.rpc(Rpc.CollectFee, { p_member_id: memberId, p_amount: amount, p_payment_method: method })) as string
  },
}
