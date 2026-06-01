/**
 * TransactionEntity — mirrors the Transactions table from DOCX schema.
 *
 * Created when a RequestEntity transitions to 'Completed'.
 * The `fee` field is denormalised from FeeEntity for convenience;
 * it is 0 for Exchange/Donation transactions.
 */
export type TransactionEntityType = 'Sale' | 'Exchange' | 'Donation';

export interface TransactionEntity {
  transactionId: number;
  productId: number; // FK -> ProductEntity.productId
  sellerId: number; // FK -> UserEntity.userId (post owner)
  buyerId: number; // FK -> UserEntity.userId (interested party)
  transactionType: TransactionEntityType;
  amount: number;
  fee: number; // denormalised from FeeEntity; 0 for non-Sale
  status: 'Completed'; // only completed transactions exist in mock
  createdAt: string; // ISO date
}
