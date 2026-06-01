/**
 * RequestEntity — intermediate request/interest entity.
 *
 * Not a standalone table in DOCX; represents the request flow before a
 * Transaction is created. Maps to the Requests table in the ERD.
 *
 * When status transitions to 'Completed', a TransactionEntity (and possibly
 * a FeeEntity) is created.
 */
export type RequestEntityType = 'Purchase' | 'Exchange' | 'Donation';
export type RequestEntityStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed';

export interface RequestEntity {
  requestId: number;
  productId: number; // FK -> ProductEntity.productId
  senderId: number; // FK -> UserEntity.userId (buyer / interested party)
  receiverId: number; // FK -> UserEntity.userId (seller / post owner)
  type: RequestEntityType;
  status: RequestEntityStatus;
  message: string; // message from sender
  contact: string; // contact info from sender
  createdAt: string; // ISO date
}
