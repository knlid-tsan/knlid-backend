import { Entity, PrimaryColumn, Column } from 'typeorm';

// Когда админ/модератор последний раз открывал раздел админки —
// для бейджей «новое с последнего просмотра» (пока используется раздел leads)
@Entity('admin_section_views')
export class AdminSectionView {
  @PrimaryColumn({ type: 'uuid' })
  admin_id: string;

  @PrimaryColumn({ type: 'varchar', length: 32 })
  section: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  viewed_at: Date;
}
