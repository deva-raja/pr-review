import { QueueTicket } from '../types/queue';

const MOCK_TICKETS: QueueTicket[] = [
  {
    id: 'TICK-101',
    customerName: 'Amina Al-Mansoor',
    serviceType: 'Account Verification',
    priority: 'HIGH',
    status: 'WAITING',
    createdAt: '10:14 AM',
    estimatedWaitMinutes: 5,
  },
  {
    id: 'TICK-102',
    customerName: 'Marcus Chen',
    serviceType: 'Document Submission',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    createdAt: '10:18 AM',
    estimatedWaitMinutes: 2,
  },
  {
    id: 'TICK-103',
    customerName: 'Sarah Jenkins',
    serviceType: 'Biometric Enrollment',
    priority: 'LOW',
    status: 'WAITING',
    createdAt: '10:22 AM',
    estimatedWaitMinutes: 12,
  },
  {
    id: 'TICK-104',
    customerName: 'Farhan Zaidi',
    serviceType: 'Card Collection',
    priority: 'HIGH',
    status: 'RESOLVED',
    createdAt: '09:55 AM',
    estimatedWaitMinutes: 0,
  },
];

export const fetchQueueTickets = async (): Promise<QueueTicket[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...MOCK_TICKETS];
};

export const updateTicketStatusApi = async (
  ticketId: string,
  newStatus: QueueTicket['status']
): Promise<{ success: boolean; ticketId: string; status: QueueTicket['status'] }> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  // Simulates intermittent network error for testing
  if (ticketId === 'TICK-103' && newStatus === 'RESOLVED') {
    throw new Error('Server timeout while processing ticket TICK-103');
  }
  return { success: true, ticketId, status: newStatus };
};
