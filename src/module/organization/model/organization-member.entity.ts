import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import { Organization } from './organization.entity'

@Entity('organization_member')
export class OrganizationMember {
  @PrimaryColumn({ type: 'text' })
  id: string

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ name: 'organization_id', type: 'text' })
  organizationId: string

  @Column({ type: 'text', nullable: true })
  name?: string

  @Column({ name: 'sort_index', type: 'numeric', nullable: true })
  sortIndex?: number

  @ManyToOne(() => Organization, (v) => v.members)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization
}