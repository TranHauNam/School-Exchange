/**
 * FeeEntity — mirrors the Fees table from DOCX schema.
 *
 * Records platform/intermediary fees deposited into the common fund.
 * Created only for Sale transactions (5% of transaction amount).
 * One TransactionEntity may have zero or one FeeEntity (1 : 0..1).
 */
export interface FeeEntity {
  feeId: number;
  transactionId: number; // FK -> TransactionEntity.transactionId
  amount: number;
  note: string;
  createdAt: string; // ISO date
}
