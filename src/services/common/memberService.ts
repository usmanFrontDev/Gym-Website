import { Rpc, Table } from '@/constants/tables'
import type { MemberStatusValue } from '@/components/common/StatusBadge'
import type {
  AssignmentRecord, FreezeRecord, MemberDetail, MemberRecord, MembersFilters, MembersPageData,
  Membership, PaymentRecord, Plan,
} from '@/types/common/member.types'
import { PAGE_SIZE } from '@/components/common/Pagination'
import { supabase, unwrap } from '../supabase-client'

const orNull = (value: string) => (value === '' ? null : value)

export interface RegisterMemberInput {
  full_name: string
  father_name: string
  phone: string
  emergency_contact: string
  email: string
  cnic: string
  address: string
  fingerprint_id: string
  plan_code: string
  amount: number
  admission_fee: number
  discount: number
  start_date: string
  trainer_id: string
  commission: number
}

export interface RecordPaymentInput {
  member_id: string
  amount: number
  plan_code: string
  start_date: string
  discount: number
}

export const memberService = {
  async list(filters: MembersFilters): Promise<MembersPageData> {
    const data = unwrap(
      await supabase.rpc(Rpc.ListMembers, {
        p_search: orNull(filters.search),
        p_status: orNull(filters.status),
        p_plan: orNull(filters.plan),
        p_from: orNull(filters.from),
        p_to: orNull(filters.to),
        p_registered_by: filters.registeredBy ?? null,
        p_page: filters.page,
        p_page_size: PAGE_SIZE,
      }),
    )
    return data as MembersPageData
  },

  async plans(): Promise<Plan[]> {
    return unwrap(await supabase.from(Table.Plans).select('*').order('price')) as Plan[]
  },

  async detail(memberId: string): Promise<MemberDetail> {
    const member = unwrap(await supabase.from(Table.Members).select('*').eq('id', memberId).single()) as MemberRecord
    const { data: membership } = await supabase
      .from(Table.Memberships)
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const status = unwrap(await supabase.rpc(Rpc.MemberStatus, { p_member_id: memberId })) as MemberStatusValue
    const { data: registrar } = await supabase.from(Table.Profiles).select('full_name').eq('id', member.registered_by).maybeSingle()
    const { data: assignment } = await supabase
      .from(Table.TrainerAssignments)
      .select('trainer:profiles!trainer_assignments_trainer_id_fkey(full_name)')
      .eq('member_id', memberId)
      .is('end_date', null)
      .maybeSingle()
    return {
      member,
      membership: (membership as Membership | null) ?? null,
      status,
      registeredByName: (registrar as { full_name: string } | null)?.full_name ?? '---',
      trainerName: (assignment as unknown as AssignmentRecord | null)?.trainer?.full_name ?? null,
    }
  },

  async payments(memberId: string): Promise<PaymentRecord[]> {
    return unwrap(
      await supabase.from(Table.Payments).select('*').eq('member_id', memberId).order('created_at', { ascending: false }),
    ) as PaymentRecord[]
  },

  async freezes(memberId: string): Promise<FreezeRecord[]> {
    return unwrap(
      await supabase.from(Table.Freezes).select('*').eq('member_id', memberId).order('frozen_on', { ascending: false }),
    ) as FreezeRecord[]
  },

  async assignments(memberId: string): Promise<AssignmentRecord[]> {
    return unwrap(
      await supabase
        .from(Table.TrainerAssignments)
        .select('id, start_date, end_date, commission_amount, trainer:profiles!trainer_assignments_trainer_id_fkey(full_name)')
        .eq('member_id', memberId)
        .order('start_date', { ascending: false }),
    ) as unknown as AssignmentRecord[]
  },

  async register(input: RegisterMemberInput): Promise<string> {
    return unwrap(
      await supabase.rpc(Rpc.RegisterMember, {
        p_full_name: input.full_name,
        p_father_name: orNull(input.father_name),
        p_phone: input.phone,
        p_emergency_contact: orNull(input.emergency_contact),
        p_email: orNull(input.email),
        p_cnic: orNull(input.cnic),
        p_address: orNull(input.address),
        p_fingerprint_id: orNull(input.fingerprint_id),
        p_plan_code: input.plan_code,
        p_amount: input.amount,
        p_admission_fee: input.admission_fee,
        p_discount: input.discount,
        p_start_date: orNull(input.start_date),
        p_trainer_id: orNull(input.trainer_id),
        p_commission: input.trainer_id ? input.commission : null,
      }),
    ) as string
  },

  async recordPayment(input: RecordPaymentInput): Promise<string> {
    return unwrap(
      await supabase.rpc(Rpc.RecordPayment, {
        p_member_id: input.member_id,
        p_amount: input.amount,
        p_plan_code: orNull(input.plan_code),
        p_start_date: orNull(input.start_date),
        p_discount: input.discount,
      }),
    ) as string
  },

  async voidPayment(paymentId: string, reason: string): Promise<void> {
    unwrap(await supabase.rpc(Rpc.VoidPayment, { p_payment_id: paymentId, p_reason: reason }))
  },

  async freeze(memberId: string): Promise<void> {
    unwrap(await supabase.rpc(Rpc.FreezeMember, { p_member_id: memberId }))
  },

  async resume(memberId: string): Promise<void> {
    unwrap(await supabase.rpc(Rpc.ResumeMember, { p_member_id: memberId }))
  },

  async assignTrainer(memberId: string, trainerId: string | null, commission: number): Promise<void> {
    unwrap(await supabase.rpc(Rpc.AssignTrainer, { p_member_id: memberId, p_trainer_id: trainerId, p_commission: commission }))
  },
}

