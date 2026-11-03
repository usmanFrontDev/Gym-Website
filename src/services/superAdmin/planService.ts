import { PAGE_SIZE } from '@/components/common/Pagination'
import { Rpc, Table } from '@/constants/tables'
import type { Paginated } from '@/types/common/api.types'
import type { DiscountMemberRow } from '@/types/superAdmin/plan.types'
import { toAppError } from '../appError'
import { supabase, unwrap } from '../supabase-client'

export interface CreatePlanInput {
  name: string
  price: number
  /** null = lifetime */
  months: number | null
  is_trainer_plan: boolean
}

export interface UpdatePlanInput {
  code: string
  name: string
  price: number
  active: boolean
}

export interface DiscountMembersFilters {
  search: string
  onlyDiscounted: boolean
  page: number
}

export const planService = {
  async discountMembers({ search, onlyDiscounted, page }: DiscountMembersFilters): Promise<Paginated<DiscountMemberRow>> {
    const from = (page - 1) * PAGE_SIZE
    let query = supabase
      .from(Table.Members)
      .select('id, full_name, phone, fingerprint_id, monthly_discount', { count: 'exact' })
      .order('monthly_discount', { ascending: false })
      .order('full_name')
      .range(from, from + PAGE_SIZE - 1)
    const term = search.trim().replace(/[%,()]/g, '')
    if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,fingerprint_id.ilike.%${term}%`)
    if (onlyDiscounted) query = query.gt('monthly_discount', 0)
    const { data, error, count } = await query
    if (error) throw toAppError(error)
    return { rows: data as DiscountMemberRow[], total: count ?? 0 }
  },

  async create(input: CreatePlanInput): Promise<string> {
    return unwrap(
      await supabase.rpc(Rpc.CreatePlan, {
        p_name: input.name, p_price: input.price, p_months: input.months, p_is_trainer: input.is_trainer_plan,
      }),
    ) as string
  },

  async update(input: UpdatePlanInput): Promise<void> {
    unwrap(await supabase.rpc(Rpc.UpdatePlan, { p_code: input.code, p_name: input.name, p_price: input.price, p_active: input.active }))
  },

  async setMemberDiscount(memberId: string, amount: number): Promise<void> {
    unwrap(await supabase.rpc(Rpc.SetMemberDiscount, { p_member_id: memberId, p_amount: amount }))
  },
}
