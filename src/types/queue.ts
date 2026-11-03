export type TicketStatus = 'WAITING' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface QueueTicket {
  id: string;
  customerName: string;
  serviceType: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  estimatedWaitMinutes: number;
}
